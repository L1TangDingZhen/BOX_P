// 根据环境自动确定基础URL
const getBaseUrl = () => {
    // 在生产环境（通过Nginx）中，使用相对URL
    return '';  // 空字符串用于相对URL，可通过Nginx代理工作
};

export const API_BASE_URL = getBaseUrl();