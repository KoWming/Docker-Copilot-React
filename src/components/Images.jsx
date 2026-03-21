import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HardDrive, Trash2, RefreshCw, Link, BrushCleaning, X, AlertCircle, CheckCircle } from 'lucide-react'
import { imageAPI } from '../api/client.js'
import { cn } from '../utils/cn.js'
import { getImageLogo } from '../config/imageLogos.js'

// 安全的图片组件
function SafeImage({ src, alt, className, fallback }) {
  const [hasError, setHasError] = React.useState(false)

  if (hasError || !src) {
    return fallback
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  )
}

export function Images() {
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, image: null })
  const [filterStatus, setFilterStatus] = useState(null) // null 表示显示全部
  const [pruneModal, setPruneModal] = useState({ isOpen: false, type: null, images: [] })
  const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' })

  // 获取自定义图标配置
  const { data: customIcons = {} } = useQuery({
    queryKey: ['customIcons'],
    queryFn: async () => {
      try {
        const response = await imageAPI.getIcons()
        if (response.data.code === 200 || response.data.code === 0) {
          const icons = response.data.data || {}
          // update localStorage
          localStorage.setItem('docker_copilot_image_logos', JSON.stringify(icons))
          return icons
        }
      } catch (err) {
        console.error('获取图标失败:', err)
      }
      return {}
    },
    // 初始数据尝试从localStorage获取
    initialData: () => {
      const saved = localStorage.getItem('docker_copilot_image_logos')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('解析本地图标配置失败:', e)
        }
      }
      return undefined
    }
  })

  // 使用 React Query 获取镜像列表，避免页面切换闪烁
  const { data: images = [], isLoading, refetch: fetchImages } = useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      setError(null)
      try {
        const response = await imageAPI.getImages()
        if (response.data && (response.data.code === 0 || response.data.code === 200)) {
          return response.data.data || []
        } else {
          setError(response.data?.msg || '获取镜像列表失败')
          return []
        }
      } catch (err) {
        setError(err.response?.data?.msg || err.message || '网络错误，请检查后端服务')
        return []
      }
    },
    refetchInterval: 10000,
  })

  const handleDeleteImage = async (imageId, force = false) => {
    try {
      setDeleteModal({ isOpen: false, image: null })

      await imageAPI.deleteImage(imageId, force)

      setSuccessModal({ isOpen: true, message: '镜像删除成功' })
      fetchImages()
      setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 3000)
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message || '删除镜像失败'
      setError(errorMsg)
    }
  }

  const handlePrune = async (type) => {
    try {
      setError(null)

      let imagesToDelete = []
      if (type === 'dangling') {
        imagesToDelete = images.filter(img => img.tag === 'None' || img.tag === '<none>')
      } else if (type === 'unused') {
        imagesToDelete = images.filter(img => !img.inUsed)
      }

      if (imagesToDelete.length === 0) {
        setError('没有找到需要清理的镜像')
        return
      }

      // 批量删除
      const deletePromises = imagesToDelete.map(image =>
        imageAPI.deleteImage(image.id, false)
      )

      await Promise.all(deletePromises)

      const message = type === 'dangling'
        ? `成功清理 ${imagesToDelete.length} 个无Tag镜像`
        : `成功清理 ${imagesToDelete.length} 个未使用的镜像`

      setSuccessModal({ isOpen: true, message })
      fetchImages()
      setTimeout(() => setSuccessModal({ isOpen: false, message: '' }), 3000)
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message || '清理镜像失败'
      setError(errorMsg)
    }
  }

  const formatImageSize = (sizeStr) => {
    if (!sizeStr) return '0 MB'
    return sizeStr.replace(/mb/gi, 'MB')
      .replace(/gb/gi, 'GB')
      .replace(/kb/gi, 'KB')
  }

  const getSizeColor = (size) => {
    const sizeInMB = parseInt(size)
    if (sizeInMB < 100) return 'text-green-600 dark:text-green-400'
    if (sizeInMB < 300) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (isLoading && images.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card p-6 h-48 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-0 pb-4 sm:py-4">
      {/* 页面头部 */}
      <div className="mb-4">
        <div className="flex justify-between items-start pt-1 sm:pt-0">
          <div className="flex-1 mr-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">镜像管理</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">查看和管理Docker镜像</p>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap justify-end items-center gap-1.5 sm:gap-3 shrink-0 mt-1 sm:mt-0">
            <button
              onClick={() => {
                const imagesToDelete = images.filter(img => img.tag === 'None' || img.tag === '<none>')
                setPruneModal({ isOpen: true, type: 'dangling', images: imagesToDelete })
              }}
              disabled={isLoading || images.filter(img => img.tag === 'None' || img.tag === '<none>').length === 0}
              className="flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-400 rounded-xl shadow-sm transition-all active:scale-95 active:opacity-90 disabled:opacity-50 text-xs sm:text-sm font-medium h-8 sm:h-10 shrink-0"
            >
              <BrushCleaning className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>无Tag</span>
            </button>
            <button
              onClick={() => {
                const imagesToDelete = images.filter(img => !img.inUsed)
                setPruneModal({ isOpen: true, type: 'unused', images: imagesToDelete })
              }}
              disabled={isLoading || images.filter(img => !img.inUsed).length === 0}
              className="flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 dark:text-purple-400 rounded-xl shadow-sm transition-all active:scale-95 active:opacity-90 disabled:opacity-50 text-xs sm:text-sm font-medium h-8 sm:h-10 shrink-0"
            >
              <BrushCleaning className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>未使用</span>
            </button>
            <button
              onClick={fetchImages}
              disabled={isLoading}
              className="flex items-center justify-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl shadow-md transition-all active:scale-95 active:opacity-90 disabled:opacity-50 text-xs sm:text-sm font-medium h-8 sm:h-10 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
              <span>刷新</span>
            </button>
          </div>
        </div>
      </div>

      {/* 状态消息 */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-800 dark:text-red-200 text-sm flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0 transition-transform active:scale-90 active:opacity-80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mx-4 sm:mx-6 mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <span className="text-green-800 dark:text-green-200 text-sm flex-1">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 flex-shrink-0 transition-transform active:scale-90 active:opacity-80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 成功弹窗 */}
      {successModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-[24px] shadow-2xl max-w-sm w-full overflow-hidden transition-all">
            <div className="px-6 py-8 flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative h-14 w-14 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center border border-green-200 dark:border-green-700">
                  <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400 animate-bounceIn" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                操作成功
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6">
                {successModal.message}
              </p>
              <button
                onClick={() => setSuccessModal({ isOpen: false, message: '' })}
                className="w-full px-4 py-2 text-sm font-medium text-white rounded-xl transition-all shadow-md active:scale-95 active:opacity-90 bg-green-500 hover:bg-green-600"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="mb-4">
        <div className="grid grid-cols-4 gap-0 rounded-2xl sm:rounded-3xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 shadow-sm divide-x divide-gray-100 dark:divide-gray-800/60 overflow-hidden text-center">
          {/* 总镜像数 */}
          <button
            onClick={() => setFilterStatus(null)}
            className={cn(
              "p-2 sm:p-3 text-center transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center active:scale-[0.98] active:opacity-90",
              filterStatus === null ? "bg-primary-50/80 dark:bg-primary-900/20" : "hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
            )}
          >
            <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 font-mono tracking-tight transition-transform duration-300 group-hover:scale-110">
                {images.length}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 group-hover:text-primary-600/70 transition-colors">总镜像</div>
            </div>
          </button>

          {/* 使用中 */}
          <button
            onClick={() => setFilterStatus('used')}
            className={cn(
              "p-2 sm:p-3 text-center transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center active:scale-[0.98] active:opacity-90",
              filterStatus === 'used' ? "bg-green-50/80 dark:bg-green-900/20" : "hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
            )}
          >
            <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 font-mono tracking-tight transition-transform duration-300 group-hover:scale-110">
                {images.filter(img => img.inUsed).length}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 group-hover:text-green-600/70 transition-colors">使用中</div>
            </div>
          </button>

          {/* 未使用 */}
          <button
            onClick={() => setFilterStatus('unused')}
            className={cn(
              "p-2 sm:p-3 text-center transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center active:scale-[0.98] active:opacity-90",
              filterStatus === 'unused' ? "bg-purple-50/80 dark:bg-purple-900/20" : "hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
            )}
          >
            <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono tracking-tight transition-transform duration-300 group-hover:scale-110">
                {images.filter(img => !img.inUsed).length}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 group-hover:text-purple-600/70 transition-colors">未使用</div>
            </div>
          </button>

          {/* 无Tag */}
          <button
            onClick={() => setFilterStatus('dangling')}
            className={cn(
              "p-2 sm:p-3 text-center transition-all duration-300 relative overflow-hidden group flex flex-col items-center justify-center active:scale-[0.98] active:opacity-90",
              filterStatus === 'dangling' ? "bg-orange-50/80 dark:bg-orange-900/20" : "hover:bg-gray-50/80 dark:hover:bg-gray-700/30"
            )}
          >
            <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
              <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono tracking-tight transition-transform duration-300 group-hover:scale-110">
                {images.filter(img => img.tag === 'None' || img.tag === '<none>').length}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 group-hover:text-orange-600/70 transition-colors">无Tag</div>
            </div>
          </button>
        </div>
      </div>

      {/* 筛选提示 */}
      {filterStatus && (
        <div className="px-4 sm:px-6 pt-2 pb-0">
          <div className="mb-0 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                筛选中：
                {filterStatus === 'used' && '使用中的镜像'}
                {filterStatus === 'unused' && '未使用的镜像'}
                {filterStatus === 'dangling' && '无Tag的镜像'}
              </span>
              <button
                onClick={() => setFilterStatus(null)}
                className="px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100 bg-blue-100 dark:bg-blue-800/50 rounded transition-colors"
              >
                清除筛选
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 镜像网格 */}
      <div className="mt-4 sm:mt-6 mb-24">
        {images.length === 0 ? (
          <div className="card p-12 text-center rounded-2xl">
            <HardDrive className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">暂无镜像</h3>
            <p className="text-gray-500 dark:text-gray-400">您还没有任何Docker镜像</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images
              .filter((image) => {
                if (!filterStatus) return true
                if (filterStatus === 'used') return image.inUsed
                if (filterStatus === 'unused') return !image.inUsed
                if (filterStatus === 'dangling') return image.tag === 'None' || image.tag === '<none>'
                return true
              })
              .map((image) => (
                <div key={image.id} className="group card p-4 rounded-2xl hover:shadow-lg transition-all">
                  {/* 头部：图标、名字、状态指示器和大小 */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <SafeImage
                        src={getImageLogo(image.name, customIcons)}
                        alt={image.name}
                        className="h-10 w-10 object-cover"
                        fallback={<HardDrive className="h-5 w-5 text-gray-500 dark:text-gray-400" />}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                          {image.name}
                        </h4>
                        {/* 状态指示器圆点 */}
                        <div className={cn(
                          "flex-shrink-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm mt-0.5",
                          image.inUsed ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                        )} title={image.inUsed ? "使用中" : "未使用"} />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center justify-between gap-2">
                        <span className="truncate">{image.tag}</span>
                        <span className={cn("font-semibold flex-shrink-0 whitespace-nowrap", getSizeColor(image.size))}>
                          大小: {formatImageSize(image.size)}
                        </span>
                      </p>
                    </div>

                    {/* 官网跳转按钮 - 始终显示 */}
                    <div className="flex gap-1">
                      <a
                        href={`https://hub.docker.com/r/${image.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 rounded transition-colors active:scale-95"
                        title="在Docker Hub查看"
                      >
                        <Link className="h-4 w-4" />
                      </a>
                    </div>
                  </div>

                  {/* 镜像信息 */}
                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">ID:</span>
                      <span className="font-mono text-gray-700 dark:text-gray-300 truncate text-xs">
                        {image.id}
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, image, force: false })}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-95 active:opacity-90"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>删除</span>
                    </button>
                    {image.inUsed && (
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, image, force: true })}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all active:scale-95 active:opacity-90"
                        title="强制删除正在使用的镜像"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>强制删除</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* 批量删除确认弹窗 */}
      {pruneModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-[24px] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden transition-all">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-center bg-orange-50/30 dark:bg-orange-900/10">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-full flex items-center justify-center border border-orange-200 dark:border-orange-700">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {pruneModal.type === 'dangling' ? '删除无Tag镜像' : '删除未使用的镜像'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    将永久删除 <span className="font-semibold text-orange-600 dark:text-orange-400">{pruneModal.images.length} 个</span> 清理项，不可恢复
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPruneModal({ isOpen: false, type: null, images: [] })}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 transition-colors self-start"
                title="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 镜像列表 - 限定高度并溢出滚动 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-2">
                {pruneModal.images.map((img) => (
                  <div key={img.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500">
                    <div className="h-8 w-8 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <SafeImage
                        src={getImageLogo(img.name, customIcons)}
                        alt={img.name}
                        className="h-8 w-8 object-cover"
                        fallback={<HardDrive className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {img.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {img.tag}
                      </p>
                    </div>
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex-shrink-0 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-lg">
                      {formatImageSize(img.size)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/50 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-700/20">
              <button
                onClick={() => setPruneModal({ isOpen: false, type: null, images: [] })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all active:scale-95 active:opacity-90"
              >
                取消
              </button>
              <button
                onClick={() => {
                  handlePrune(pruneModal.type)
                  setPruneModal({ isOpen: false, type: null, images: [] })
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white rounded-xl transition-all shadow-md active:scale-95 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    删除中...
                  </span>
                ) : (
                  '确认删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden transition-all">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-center bg-red-50/30 dark:bg-red-900/10">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 rounded-full flex items-center justify-center border border-red-200 dark:border-red-700">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {deleteModal.force ? '强制删除镜像' : '删除镜像'}
                </h3>
              </div>
              <button
                onClick={() => setDeleteModal({ isOpen: false, image: null })}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                title="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {deleteModal.force ? (
                  <>
                    确定要强制删除镜像{' '}
                    <span className="font-semibold text-red-600 dark:text-red-400">"{deleteModal.image?.name}"</span>
                    {' '}吗？这将删除正在使用的此镜像，且不可恢复。
                  </>
                ) : (
                  <>
                    确定要删除镜像{' '}
                    <span className="font-semibold text-red-600 dark:text-red-400">"{deleteModal.image?.name}"</span>
                    {' '}吗？此操作不可恢复。
                  </>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700/50 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-700/20">
              <button
                onClick={() => setDeleteModal({ isOpen: false, image: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-all active:scale-95 active:opacity-90"
              >
                取消
              </button>
              <button
                onClick={() => deleteModal.image && handleDeleteImage(deleteModal.image.id, deleteModal.force)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white rounded-xl transition-all shadow-md active:scale-95 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    删除中...
                  </span>
                ) : (
                  '确认删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
