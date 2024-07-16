mod utils;

use anyhow::Result;
use axum::{
    body::{Body, HttpBody},
    extract::{Extension, State},
    http::{self, Request, StatusCode},
    middleware::Next,
    response::Response,
    routing::{delete, get, patch, post},
    Json, Router,
};
use chrono::{Datelike, Local};
use log::info;
use tower_http::services::ServeDir;
use std::net::SocketAddr;
use utils::crypto::{decrypt, encrypt, generate_key};
use utils::data_type::{
    AppUser, ConfigCreateReq, ConfigInfo, ConfigPatchReq, DetailResponse, UserCreateReq, UserInfo,
};
use utils::digest::sha512;

#[tokio::main]
async fn main() -> Result<()> {
    
    utils::init_logging();
    let db_connection_str =
        std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://data/data.db?mode=rwc".to_string());
    let pool: sqlx::Pool<sqlx::Sqlite> = sqlx::SqlitePool::connect(&db_connection_str).await?;
    let _migrate_result = sqlx::migrate!().run(&pool).await?;
    let serve_dir = ServeDir::new("static-root");

    let app = Router::new()
        .route("/api/1/user", get(api_user_get))
        .route("/api/1/user", post(api_user_post))
        .route("/api/1/user", delete(api_user_delete))
        .route("/api/1/user", patch(api_user_patch))
        .route("/api/1/configs", get(api_configs_get))
        .route("/api/1/configs", post(api_configs_post))
        .route("/api/1/configs/:id", get(api_configs_id_get))
        .route("/api/1/configs/:id", patch(api_configs_id_patch))
        .route("/api/1/configs/:id", delete(api_configs_id_delete))
        .fallback_service(serve_dir)
        .with_state(pool.clone())
        .route_layer(axum::middleware::from_fn_with_state(
            pool.clone(),
            middleware_func,
        ));
    info!("Listening on http://0.0.0.0:3000");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;

    #[cfg(debug_assertions)]
    axum::serve(
        listener,
        app.layer(tower_http::cors::CorsLayer::permissive())
            .into_make_service_with_connect_info::<SocketAddr>(),
    ).await?;

    #[cfg(not(debug_assertions))]
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    ).await?;

    Ok(())
}

async fn middleware_func(
    axum::extract::ConnectInfo(addr): axum::extract::ConnectInfo<SocketAddr>,
    State(pool): State<sqlx::Pool<sqlx::Sqlite>>,
    mut request: Request<Body>,
    next: Next,
) -> Result<Response, StatusCode> {
    let req_uri = request.uri().path().to_string();
    let req_method = request.method().to_string();
    let req_version = format!("{:?}", request.version());
    let response: Response<Body>;
    let mut client_ip = addr.ip().to_string();
    match request.headers().get("X-Forwarded-For") {
        Some(ip) => {
            client_ip = ip.to_str().unwrap().to_string();
        }
        None => {}
    }
    if req_uri == "/api/1/user" && req_method == "POST" {
        response = next.run(request).await;
    } else {
        match request.headers().get("Authorization") {
            Some(token) => match token_is_valid(
                pool.clone(),
                &token.to_str().unwrap().replace("Bearer ", ""),
            )
            .await
            {
                Some(mut current_user) => {
                    current_user.token = token.to_str().unwrap().replace("Bearer ", "");
                    request.extensions_mut().insert(current_user);
                    response = next.run(request).await;
                }
                None => {
                    let body = DetailResponse {
                        detail: "You do not have permission to perform this action.".to_owned(),
                    };

                    response = axum::http::response::Builder::new()
                        .status(StatusCode::FORBIDDEN)
                        .header(http::header::CONTENT_TYPE, "application/json")
                        .body(Body::from(serde_json::to_string(&body).unwrap()))
                        .unwrap();
                }
            },
            _ => {
                let body = DetailResponse {
                    detail: "You do not have permission to perform this action.".to_owned(),
                };

                response = axum::http::response::Builder::new()
                    .status(StatusCode::FORBIDDEN)
                    .header(http::header::CONTENT_TYPE, "application/json")
                    .body(Body::from(serde_json::to_string(&body).unwrap()))
                    .unwrap();
            }
        }
    }

    info!(
        "{} - \"{} {} {}\" {} {}",
        client_ip,
        req_method,
        req_uri,
        req_version,
        response.status().as_u16(),
        response.body().size_hint().lower()
    );

    Ok(response)
}

async fn token_is_valid(pool: sqlx::Pool<sqlx::Sqlite>, token: &str) -> Option<AppUser> {
    let token = sha512(token.as_bytes());
    let query_str = "SELECT *,'' as token FROM app_user WHERE token_hash = ?";
    let current_user = sqlx::query_as::<_, AppUser>(query_str)
        .bind(token)
        .fetch_one(&pool)
        .await;
    current_user.ok()
}

async fn api_user_post(
    State(pool): State<sqlx::Pool<sqlx::Sqlite>>,
    Json(payload): Json<UserCreateReq>,
) -> Result<(StatusCode, Json<AppUser>), (StatusCode, std::string::String)> {
    let disable_signup = std::env::var("DISABLE_SIGNUP").unwrap_or_else(|_| "false".to_string());
    if disable_signup.to_lowercase() == "true" {
        return Err((StatusCode::FORBIDDEN, "Signup is disabled".to_owned()));
    }
    let insert_str = "INSERT INTO app_user (username,token_hash,created_at,modified_at) 
        VALUES ($1, $2,strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        RETURNING *,'' as token";
    let token = generate_key();
    let token_hash = sha512(token.as_bytes());
    let new_user = sqlx::query_as::<_, AppUser>(insert_str)
        .bind(payload.username)
        .bind(token_hash)
        .fetch_one(&pool)
        .await
        .map_err(internal_error);
    match new_user {
        Ok(mut user) => {
            user.token = token;
            Ok((StatusCode::CREATED, Json(user)))
        }
        Err(e) => Err(e),
    }
}

async fn api_user_patch(
    Extension(current_user): Extension<AppUser>,
    State(pool): State<sqlx::Pool<sqlx::Sqlite>>,
) -> Result<(StatusCode, Json<UserInfo>), (StatusCode, std::string::String)> {
    let insert_str =
        "UPDATE app_user SET token_hash = $1, modified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE token_hash = $2 
         RETURNING *,'' as token";
    let new_token = generate_key();
    let new_token_hash = sha512(new_token.as_bytes());
    let old_token_hash = current_user.token_hash;
    let new_user = sqlx::query_as::<_, AppUser>(insert_str)
        .bind(new_token_hash)
        .bind(old_token_hash.clone())
        .fetch_one(&pool)
        .await
        .map_err(internal_error);
    match new_user {
        Ok(mut user) => {
            user.token = old_token_hash;
            Ok((
                StatusCode::CREATED,
                Json(UserInfo {
                    id: user.id,
                    username: user.username.clone(),
                    active_config_id: user.active_config_id,
                    custom_connection_gateway: None,
                    custom_connection_gateway_token: None,
                    config_sync_token: new_token,
                    is_pro: true,
                    is_sponsor: false,
                    github_username: user.username,
                }),
            ))
        }
        Err(e) => Err(e),
    }
}

async fn api_user_get(
    Extension(current_user): Extension<AppUser>,
) -> Result<Json<UserInfo>, StatusCode> {
    Ok(Json(UserInfo {
        id: current_user.id,
        username: current_user.username.clone(),
        active_config_id: current_user.active_config_id,
        custom_connection_gateway: None,
        custom_connection_gateway_token: None,
        config_sync_token: current_user.token,
        is_pro: true,
        is_sponsor: false,
        github_username: current_user.username,
    }))
}

async fn api_user_delete(
    Extension(current_user): Extension<AppUser>,
    State(pool): State<sqlx::Pool<sqlx::Sqlite>>,
) -> Result<(StatusCode, std::string::String), (StatusCode, std::string::String)> {
    let delete_str = "DELETE FROM app_user WHERE id = $1 RETURNING *,'' as token";

    let delete_result: std::result::Result<AppUser, (StatusCode, String)> =
        sqlx::query_as::<_, AppUser>(delete_str)
            .bind(current_user.id)
            .fetch_one(&pool)
            .await
            .map_err(internal_error);
    match delete_result {
        Ok(_user) => Ok((StatusCode::NO_CONTENT, "".to_string())),
        Err(e) => Err(e),
    }
}

async fn api_configs_get(
    Extension(current_user): Extension<AppUser>,
    State(pool): State<sqlx::Pool<sqlx::Sqlite>>,
) -> Result<Json<Vec<ConfigInfo>>, (StatusCode, std::string::String)> {
    let query_str = "SELECT * FROM app_config WHERE user_id = ?";
    let configs_result: std::result::Result<Vec<ConfigInfo>, (StatusCode, String)> =
        sqlx::query_as::<_, ConfigInfo>(query_str)
            .bind(current_user.id)
            .fetch_all(&pool)
            .await
            .map_err(internal_error);
    match configs_result {
        Ok(mut configs) => {
            for config in &mut configs {
                let content_result = decrypt(&current_user.token, config.content.clone());
                if content_result.is_err() {
                    let err_message = content_result.err().unwrap();
                    return Err((StatusCode::INTERNAL_SERVER_ERROR, err_message));
                }
                config.content = content_result.unwrap();
            }
            Ok(Json(configs))
        }
        Err(e) => Err(e),
    }
}

async fn api_configs_post(
    Extension(current_user): Extension<AppUser>,
    State(pool): State<sqlx::Pool<sqlx::Sqlite>>,
    Json(payload): Json<ConfigCreateReq>,
) -> Result<(StatusCode, Json<ConfigInfo>), (StatusCode, std::string::String)> {
    let name: String;
    let content = encrypt(&current_user.token, "{}".to_owned()).unwrap();
    if payload.name.len() < 1 {
        let current_date = Local::now();
        name = format!(
            "Unnamed config ({:?}-{:02}-{:02})",
            current_date.year(),
            current_date.month(),
            current_date.day()
        );
    } else {
        name = payload.name;
    }
    let insert_str =
        "INSERT INTO app_config (content, user_id, name, created_at, modified_at) 
        VALUES ($1, $2, $3,strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) 
        RETURNING *";
    let config_create_result: std::result::Result<ConfigInfo, (StatusCode, String)> =
        sqlx::query_as::<_, ConfigInfo>(insert_str)
            .bind(content)
            .bind(current_user.id)
            .bind(name)
            .fetch_one(&pool)
            .await
            .map_err(internal_error);
    match config_create_result {
        Ok(mut config) => match decrypt(&current_user.token, config.content) {
            Ok(content) => {
                config.content = content;
                Ok((StatusCode::CREATED, Json(config)))
            }
            Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
        },
        Err(e) => Err(e),
    }
}

async fn api_configs_id_get(
    Extension(current_user): Extension<AppUser>,
    State(pool): State<sqlx::Pool<sqlx::Sqlite>>,
    axum::extract::Path(config_id): axum::extract::Path<i32>,
) -> Result<Json<ConfigInfo>, (StatusCode, std::string::String)> {
    let query_str = "SELECT * FROM app_config WHERE id = ? AND user_id = ?";
    let config_result: std::result::Result<ConfigInfo, (StatusCode, String)> =
        sqlx::query_as::<_, ConfigInfo>(query_str)
            .bind(config_id)
            .bind(current_user.id)
            .fetch_one(&pool)
            .await
            .map_err(internal_error);
    match config_result {
        Ok(mut config) => {
            let content_result = decrypt(&current_user.token, config.content.clone());
            if content_result.is_err() {
                let err_message = content_result.err().unwrap();
                return Err((StatusCode::INTERNAL_SERVER_ERROR, err_message));
            }
            config.content = content_result.unwrap();
            Ok(Json(config))
        }
        Err(e) => Err(e),
    }
}

async fn api_configs_id_patch(
    Extension(current_user): Extension<AppUser>,
    State(pool): State<sqlx::Pool<sqlx::Sqlite>>,
    axum::extract::Path(config_id): axum::extract::Path<i32>,
    Json(payload): Json<ConfigPatchReq>,
) -> Result<Json<ConfigInfo>, (StatusCode, std::string::String)> {
    let content = match encrypt(&current_user.token, payload.content) {
        Ok(content) => content,
        Err(e) => {
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };
    let update_str = "UPDATE app_config 
    SET content = $1,last_used_with_version = $2 , modified_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = $3 AND user_id = $4 
    RETURNING *";
    let config_update_result = sqlx::query_as::<_, ConfigInfo>(update_str)
        .bind(content)
        .bind(payload.last_used_with_version)
        .bind(config_id)
        .bind(current_user.id)
        .fetch_one(&pool)
        .await
        .map_err(internal_error);

    match config_update_result {
        Ok(mut config) => {
            let content_result = decrypt(&current_user.token, config.content.clone());
            if content_result.is_err() {
                let err_message = content_result.err().unwrap();
                return Err((StatusCode::INTERNAL_SERVER_ERROR, err_message));
            }
            config.content = content_result.unwrap();
            Ok(Json(config))
        }
        Err(e) => Err(e),
    }
}

async fn api_configs_id_delete(
    Extension(current_user): Extension<AppUser>,
    State(pool): State<sqlx::Pool<sqlx::Sqlite>>,
    axum::extract::Path(config_id): axum::extract::Path<i32>,
) -> Result<(StatusCode, std::string::String), (StatusCode, std::string::String)> {
    let delete_str = "DELETE FROM app_config WHERE id = $1 AND user_id = $2 RETURNING *";

    let delete_result: std::result::Result<ConfigInfo, (StatusCode, String)> =
        sqlx::query_as::<_, ConfigInfo>(delete_str)
            .bind(config_id)
            .bind(current_user.id)
            .fetch_one(&pool)
            .await
            .map_err(internal_error);
    match delete_result {
        Ok(_config) => Ok((StatusCode::NO_CONTENT, "".to_string())),
        Err(e) => Err(e),
    }
}


fn internal_error<E>(err: E) -> (StatusCode, String)
where
    E: std::error::Error,
{
    let res_str = serde_json::to_string(&DetailResponse {
        detail: err.to_string(),
    })
    .unwrap();
    (StatusCode::BAD_REQUEST, res_str)
}
