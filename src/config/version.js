/**
 * 版本管理配置文件
 * 用于集中管理应用的版本信息
 * 
 * 版本号格式: major.minor.patch (e.g., 1.0.0)
 * - major: 主版本号，功能有重大改变时增加
 * - minor: 次版本号，添加新功能时增加
 * - patch: 补丁版本号，修复bug时增加
 */

export const VERSION_CONFIG = {
  // 当前前端版本
  FRONTEND_VERSION: '1.0.0',
  
  // 应用构建时间 (ISO 8601 格式)
  BUILD_TIME: new Date().toISOString(),
  
  // 应用构建环境
  BUILD_ENV: import.meta.env.VITE_DEV ? 'development' : 'production',
  
  // 应用名称
  APP_NAME: 'Docker Copilot Frontend',
  
  // 应用描述
  APP_DESC: 'Docker 容器管理前端应用',
  
  // GitHub 仓库信息
  GITHUB_REPO: 'dongshull/Docker-Copilot-React',
  GITHUB_API_URL: 'https://api.github.com',
  
  // GitHub 更新检查配置
  CHECK_FRONTEND_UPDATE: true,  // 是否检查前端更新
}

/**
 * 获取版本信息对象
 * @returns {Object} 包含所有版本相关信息的对象
 */
export function getVersionInfo() {
  return {
    ...VERSION_CONFIG,
    buildTime: new Date(VERSION_CONFIG.BUILD_TIME),
  }
}

/**
 * 检查版本是否需要更新
 * @param {string} currentVersion 当前版本
 * @param {string} latestVersion 最新版本
 * @returns {boolean} 是否需要更新
 */
export function shouldUpdate(currentVersion, latestVersion) {
  if (currentVersion === 'unknown' || latestVersion === 'unknown') {
    return false
  }
  
  const current = parseVersion(currentVersion)
  const latest = parseVersion(latestVersion)
  
  if (current === null || latest === null) {
    return false
  }
  
  // 比较 major.minor.patch
  if (latest.major > current.major) return true
  if (latest.major === current.major && latest.minor > current.minor) return true
  if (latest.major === current.major && latest.minor === current.minor && latest.patch > current.patch) return true
  
  return false
}

/**
 * 解析版本号
 * @param {string} version 版本号字符串 (e.g., "1.0.0")
 * @returns {Object|null} 解析后的版本对象或 null
 */
export function parseVersion(version) {
  if (!version || typeof version !== 'string') return null
  
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/)
  if (!match) return null
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    raw: version,
  }
}

/**
 * 格式化构建时间
 * @param {string|Date} dateString 日期字符串或 Date 对象
 * @returns {string} 格式化后的时间字符串 (YYYY-MM-DD HH:MM:SS)
 */
export function formatBuildTime(dateString) {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }
    
    // 转换为北京时间 (UTC+8)
    const beijingDate = new Date(date.getTime() + 8 * 60 * 60 * 1000)
    
    return beijingDate.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  } catch (error) {
    return dateString
  }
}
