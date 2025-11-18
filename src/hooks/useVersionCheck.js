import { useEffect, useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { versionAPI } from '../api/client.js'
import { githubAPI } from '../api/client.js'
import { VERSION_CONFIG, shouldUpdate, parseVersion, formatBuildTime } from '../config/version.js'

/**
 * 版本检查 Hook
 * 用于检查前端和后端版本，并提示用户是否有更新
 */
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [frontendHasUpdate, setFrontendHasUpdate] = useState(false)
  const [latestFrontendVersion, setLatestFrontendVersion] = useState(null)
  const [frontendReleaseUrl, setFrontendReleaseUrl] = useState(null)

  // 查询后端版本信息
  const { data: versionData, refetch } = useQuery({
    queryKey: ['version'],
    queryFn: async () => {
      try {
        // 获取本地版本信息
        const localResponse = await versionAPI.getVersion('local')
        
        let backendVersion = 'unknown'
        let buildDate = ''
        
        if (localResponse.data.code === 200 || localResponse.data.code === 0) {
          const localData = localResponse.data.data
          if (localData && typeof localData === 'object') {
            backendVersion = localData.version || 'unknown'
            buildDate = localData.buildDate || ''
          } else if (typeof localData === 'string') {
            backendVersion = localData
          }
        }
        
        // 获取远端版本信息
        let remoteVersion = 'unknown'
        let frontendUpdateUrl = ''
        
        try {
          const remoteResponse = await versionAPI.getVersion('remote')
          
          if (remoteResponse.data.code === 200 || remoteResponse.data.code === 0) {
            const remoteData = remoteResponse.data.data
            if (remoteData && typeof remoteData === 'object') {
              remoteVersion = remoteData.remoteVersion || remoteVersion
              frontendUpdateUrl = remoteData.updateUrl || ''
            } else if (typeof remoteData === 'string') {
              remoteVersion = remoteData
            }
          }
        } catch (error) {
          console.warn('获取远端版本信息失败:', error)
        }
        
        return {
          frontendVersion: VERSION_CONFIG.FRONTEND_VERSION,
          backendVersion,
          remoteVersion,
          buildDate,
          hasBackendUpdate: shouldUpdate(backendVersion, remoteVersion),
          frontendUpdateUrl
        }
      } catch (error) {
        console.error('获取版本信息失败:', error)
        return {
          frontendVersion: VERSION_CONFIG.FRONTEND_VERSION,
          backendVersion: 'unknown',
          remoteVersion: 'unknown',
          buildDate: '',
          hasBackendUpdate: false,
          frontendUpdateUrl: ''
        }
      }
    },
    refetchInterval: 60000, // 每分钟自动刷新
    refetchOnWindowFocus: false,
    staleTime: 30000 // 30秒内不重新请求
  })

  // 查询前端版本信息（从 GitHub）
  const { data: githubReleaseData } = useQuery({
    queryKey: ['frontendVersion'],
    queryFn: async () => {
      if (!VERSION_CONFIG.CHECK_FRONTEND_UPDATE) {
        return null
      }
      
      try {
        const [owner, repo] = VERSION_CONFIG.GITHUB_REPO.split('/')
        const release = await githubAPI.getLatestRelease(owner, repo)
        
        // 从 release tag 提取版本号
        const tagVersion = release.tag_name.replace(/^v/, '')
        const hasUpdate = shouldUpdate(VERSION_CONFIG.FRONTEND_VERSION, tagVersion)
        
        return {
          latestVersion: tagVersion,
          releaseUrl: release.html_url,
          downloadUrl: release.assets?.[0]?.browser_download_url || release.html_url,
          releaseNotes: release.body,
          publishedAt: release.published_at,
          hasUpdate
        }
      } catch (error) {
        console.warn('检查 GitHub 前端版本失败:', error.message)
        return null
      }
    },
    refetchInterval: 3600000, // 每小时刷新一次
    refetchOnWindowFocus: false,
    staleTime: 1800000, // 30分钟内不重新请求
  })

  // 监听 GitHub Release 更新
  useEffect(() => {
    if (githubReleaseData?.hasUpdate) {
      setFrontendHasUpdate(true)
      setLatestFrontendVersion(githubReleaseData.latestVersion)
      setFrontendReleaseUrl(githubReleaseData.releaseUrl)
      setUpdateAvailable(true)
    }
  }, [githubReleaseData?.hasUpdate])

  // 监听后端版本更新
  useEffect(() => {
    if (versionData?.hasBackendUpdate) {
      setUpdateAvailable(true)
    }
  }, [versionData?.hasBackendUpdate])

  // 保存当前版本到 localStorage
  useEffect(() => {
    localStorage.setItem('docker_copilot_last_version', VERSION_CONFIG.FRONTEND_VERSION)
  }, [])

  // 刷新页面（更新前端）
  const refreshPage = useCallback(() => {
    // 清除缓存并重载
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name)
        })
      })
    }
    window.location.reload()
  }, [])

  // 更新后端
  const updateBackend = useCallback(async () => {
    try {
      await versionAPI.updateProgram()
      setShowUpdatePrompt(true)
      // 3秒后自动刷新
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (error) {
      console.error('后端更新失败:', error)
      alert('后端更新失败，请手动重启应用')
    }
  }, [])

  // 打开 GitHub Release 页面
  const openGithubRelease = useCallback(() => {
    if (frontendReleaseUrl) {
      window.open(frontendReleaseUrl, '_blank')
    }
  }, [frontendReleaseUrl])

  // 手动检查更新
  const checkForUpdates = useCallback(async () => {
    await refetch()
  }, [refetch])

  return {
    // 状态
    updateAvailable,
    showUpdatePrompt,
    frontendHasUpdate,
    
    // 版本数据
    frontendVersion: versionData?.frontendVersion || VERSION_CONFIG.FRONTEND_VERSION,
    latestFrontendVersion,
    frontendReleaseUrl,
    backendVersion: versionData?.backendVersion,
    remoteVersion: versionData?.remoteVersion,
    buildDate: versionData?.buildDate,
    buildTime: VERSION_CONFIG.BUILD_TIME,
    buildEnv: VERSION_CONFIG.BUILD_ENV,
    hasBackendUpdate: versionData?.hasBackendUpdate,
    
    // 方法
    setShowUpdatePrompt,
    refreshPage,
    updateBackend,
    checkForUpdates,
    openGithubRelease,
    formatBuildTime,
  }
}
