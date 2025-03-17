// 自动检测当前环境并设置正确的API基础URL
const getApiBaseUrl = () => {
    const currentHost = window.location.hostname;
    
    // 如果是本地开发环境
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:8000'; // 本地后端地址
    }
    
    // 生产环境使用相对路径（自动指向当前主机）
    return ''; 
};
export const API_BASE_URL = getApiBaseUrl();