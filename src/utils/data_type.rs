use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;


#[derive(Deserialize,Serialize)]
pub struct DetailResponse{
    pub detail:String
}


#[derive(Deserialize,Serialize,FromRow,Clone,Debug)]
pub struct AppUser {
    pub id: i64,
    pub username: String,
    pub active_version: Option<String>,
    pub created_at: String,
    pub modified_at: String,
    pub last_login: Option<String>,
    pub active_config_id: Option<i64>,
    pub token_hash: String,
    pub token: String
}


#[derive(Deserialize,Serialize,FromRow,Clone,Debug)]
pub struct UserInfo {
    pub id: i64,
    pub username: String,
    pub active_config_id: Option<i64>,
    pub custom_connection_gateway: Option<String>, // tabby-web API返回值为null,客户端未使用该值
    pub custom_connection_gateway_token: Option<String>, // tabby-web API返回值为null,客户端未使用该值
    pub config_sync_token: String,
    pub is_pro: bool, // tabby-web API返回值为true,客户端未使用该值
    pub is_sponsor: bool, // tabby-web API返回值为false,客户端未使用该值
    pub github_username: String, // tabby-web API返回值为实际值,但客户端未使用该值
}

#[derive(Deserialize,Serialize,FromRow,Clone,Debug)]
pub struct ConfigInfo {
    pub id: i64,
    pub name: String,
    pub content: String,
    pub last_used_with_version: Option<String>,
    pub created_at: String,
    pub modified_at: String,
    pub user_id: i64
}

#[derive(Deserialize,Serialize)]
pub struct ConfigCreateReq{
    pub name: String
}


#[derive(Deserialize,Serialize,Clone,Debug)]
pub struct UserCreateReq{
    pub username: String
}

#[derive(Deserialize,Serialize)]
pub struct ConfigPatchReq {
    pub content: String,
    pub last_used_with_version: String,
}

