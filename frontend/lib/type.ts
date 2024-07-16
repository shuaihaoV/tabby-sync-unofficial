export interface UserInfo {
    id: number;
    username: string;
    active_config_id: number | null;
    custom_connection_gateway: string | null;
    custom_connection_gateway_token: string | null;
    config_sync_token: string;
    is_pro: boolean;
    is_sponsor: boolean;
    github_username: string;
}

export interface ConfigInfo {
    id: number;
    name: string;
    content: string;
    last_used_with_version: string | null;
    created_at: string;
    modified_at: string;
    user_id: number;
}


// export const URL_PREFIX = "http://localhost:3001";
export const URL_PREFIX = "";
