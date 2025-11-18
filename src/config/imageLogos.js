// 内置常用镜像logo配置
// 格式: { "镜像名称": "logo URL" }
// 格式: { "镜像名称": "logo 地址" }
// 格式: { "镜像名称": "logo  Base64" }
// 支持镜像名称匹配，如 "nginx" 会匹配 "nginx:latest", "nginx:alpine" 等

export const builtInImageLogos = {
  "xylplm/media-saber": "https://icon.xiaoge.org/images/docker/MediaSaber.png",
  "jxxghp/moviepilot-v2": "/src/config/image/146.png",
  "mtphotos/mt-photos": "https://icon.xiaoge.org/images/docker/MT-Photos.png",
  "kqstone/mt-photos-insightface-unofficial": "https://icon.xiaoge.org/images/docker/MT-Photos.png",
  "mtphotos/mt-photos-ai": "https://icon.xiaoge.org/images/docker/MT-Photos.png",
  "corentinth/it-tools": "/src/config/image/IT-Tools_w7z24.webp",
  "0nlylty/dockercopilot": "https://icon.xiaoge.org/images/docker/DockerCopilot-3.png",
  "xream/sub-store": "/src/config/image/Sub-Store.webp",
  "nyanmisaka/jellyfin": "/src/config/image/132.png",
  "redis": "/src/config/image/165.png",
  "postgres": "/src/config/image/159.png",
  "hslr/sun-panel": "/src/config/image/175.png",
  "whyour/qinglong": "https://qn.whyour.cn/favicon.svg",
  "linuxserver/transmission": "/src/config/image/189.png",
  "linuxserver/qbittorrent": "/src/config/image/QBittorrent_Q41Q0.webp",
  "imgzcq/fndesk": "/src/config/image/718.png",
  "qiaokes/fntv-record-view": "/src/config/image/718.png",
  "easychen/cookiecloud": "/src/config/image/100.png",
  "gdy666/lucky": "/src/config/image/4.png"  
};

// 获取镜像的logo URL
// 优先级: 内置logo > 用户自定义 > 默认图标
export const getImageLogo = (imageName, customLogos = {}) => {
  // 先检查内置logo（优先级最高）
  const baseImageName = imageName.split(':')[0]; // 去掉tag部分
  if (builtInImageLogos[baseImageName]) {
    return builtInImageLogos[baseImageName];
  }
  
  // 再检查用户自定义的logo
  if (customLogos[imageName]) {
    return customLogos[imageName];
  }
  
  // 没有找到logo，返回null
  return null;
};

// 获取所有支持的镜像名称列表
export const getSupportedImageNames = () => {
  return Object.keys(builtInImageLogos);
};

// 检查镜像是否有内置logo
export const hasBuiltInLogo = (imageName) => {
  const baseImageName = imageName.split(':')[0];
  return builtInImageLogos[baseImageName] !== undefined;
};