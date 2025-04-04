// 根据环境自动确定基础URL
const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return '';  // 开发环境使用相对URL
    }
    return '';  // 生产环境也使用相对URL，通过Nginx代理
};

export const API_BASE_URL = getBaseUrl();