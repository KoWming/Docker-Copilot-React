import React, { useState, useEffect } from 'react'
import { HardDrive, Trash, Trash2, Calendar, Download, RefreshCw, Link, BrushCleaning, List, ImageIcon } from 'lucide-react'
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
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImages, setSelectedImages] = useState([]) // 用于多选功能
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false) // 多选模式状态
  const [viewMode, setViewMode] = useState('list') // 视图模式: 'list' 或 'grid'




  const fetchImages = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('开始获取镜像列表...')
      
      // 检查token
      const token = localStorage.getItem('docker_copilot_token')
      console.log('当前token:', token)
      
      if (!token) {
        setError('未找到认证令牌，请重新登录')
        setIsLoading(false)
        return
      }
      
      // 使用imageAPI调用正确的路径
      const response = await imageAPI.getImages()
      console.log('镜像API响应:', response)
      
      // 根据实际API响应调整状态码检查
      if (response.data && (response.data.code === 0 || response.data.code === 200)) {
        setImages(response.data.data || [])
        console.log('成功获取镜像列表:', response.data.data)
      } else {
        const errorMsg = response.data?.msg || '未知错误'
        console.error('获取镜像列表失败:', errorMsg)
        setError(errorMsg)
        setImages([])
      }
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message || '网络错误，请检查后端服务'
      console.error('获取镜像列表失败:', errorMsg)
      console.error('错误详情:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        config: error.config
      })
      
      setError(errorMsg)
      
      // 特别处理401错误
      if (error.response?.status === 401) {
        console.error('认证失败，请重新登录')
        setError('认证已过期，请重新登录')
        // 不自动刷新页面，让用户看到错误信息
      }
      setImages([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleDeleteImage = async (imageId, force = false) => {
    try {
      // 添加确认提示
      const confirmMessage = force 
        ? '确定要强制删除此镜像吗？这将删除正在使用的镜像！' 
        : '确定要删除此镜像吗？';
      
      if (!window.confirm(confirmMessage)) {
        return;
      }

      setIsLoading(true)
      
      await imageAPI.deleteImage(imageId, force)
      // 刷新镜像列表
      fetchImages()
    } catch (error) {
      console.error('删除镜像失败:', error)
      const errorMsg = error.response?.data?.msg || error.message || '删除镜像失败'
      setError(errorMsg)
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('docker_copilot_token')
    window.location.reload()
  }



  // 切换多选模式
  const toggleMultiSelectMode = () => {
    if (isMultiSelectMode) {
      // 退出多选模式时清空选择
      setSelectedImages([])
    }
    setIsMultiSelectMode(!isMultiSelectMode)
  }

  // 切换单个镜像的选中状态
  const toggleImageSelection = (imageId) => {
    if (selectedImages.includes(imageId)) {
      setSelectedImages(selectedImages.filter(id => id !== imageId))
    } else {
      setSelectedImages([...selectedImages, imageId])
    }
  }

  // 切换所有镜像的选中状态
  const toggleSelectAll = () => {
    if (selectedImages.length === images.length) {
      // 如果已经全选，则取消全选
      setSelectedImages([])
    } else {
      // 否则全选所有镜像
      setSelectedImages(images.map(img => img.id))
    }
  }

  // 批量删除镜像
  const handleBatchDelete = async (force = false) => {
    try {
      if (selectedImages.length === 0) return

      const confirmMessage = force 
        ? `确定要强制删除选中的 ${selectedImages.length} 个镜像吗？这将删除正在使用的镜像！` 
        : `确定要删除选中的 ${selectedImages.length} 个镜像吗？`

      if (!window.confirm(confirmMessage)) {
        return
      }

      setIsLoading(true)
      
      // 批量删除镜像
      const deletePromises = selectedImages.map(imageId => 
        imageAPI.deleteImage(imageId, force)
      )
      
      await Promise.all(deletePromises)
      
      // 清空选择并刷新列表
      setSelectedImages([])
      setIsMultiSelectMode(false)
      fetchImages()
      
      // 显示成功消息
      console.log(`${selectedImages.length} 个镜像删除成功`)
    } catch (error) {
      console.error('批量删除镜像失败:', error)
      const errorMsg = error.response?.data?.msg || error.message || '批量删除镜像失败'
      setError(errorMsg)
      setIsLoading(false)
    }
  }

  const getSizeColor = (size) => {
    const sizeInMB = parseInt(size)
    if (sizeInMB < 100) return 'text-green-600 dark:text-green-400'
    if (sizeInMB < 300) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const formatImageSize = (sizeStr) => {
    if (!sizeStr) return '0 MB'
    
    // 将小写的"b"替换为大写的"B"
    return sizeStr.replace(/mb/gi, 'MB')
                  .replace(/gb/gi, 'GB')
                  .replace(/kb/gi, 'KB')
                  .replace(/b/g, 'B')
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">镜像管理</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            管理您的Docker镜像，包括查看、删除等操作
          </p>
        </div>
        <div className="flex space-x-3">
          {isMultiSelectMode ? (
            <>
              <button 
                onClick={toggleSelectAll}
                className="btn-secondary"
              >
                {selectedImages.length === images.length ? '取消全选' : '全选'}
              </button>
              <button 
                onClick={() => handleBatchDelete(false)}
                disabled={selectedImages.length === 0 || isLoading}
                className="btn-secondary"
              >
                <Trash className="h-4 w-4 mr-2" />
                删除 ({selectedImages.length})
              </button>
              <button 
                onClick={() => handleBatchDelete(true)}
                disabled={selectedImages.length === 0 || isLoading}
                className="btn-secondary text-red-600 dark:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                强制删除 ({selectedImages.length})
              </button>
              <button 
                onClick={toggleMultiSelectMode}
                className="btn-primary"
              >
                完成
              </button>
            </>
          ) : (
            <>
              <div className="flex">
                <button 
                  className="btn-secondary rounded-l-lg rounded-r-none border-r border-gray-300 dark:border-gray-600"
                  title="清理没有tag的镜像"
                >
                  <BrushCleaning className="h-4 w-4" />
                  <span className="ml-2">无Tag</span>
                </button>
                <button 
                  className="btn-secondary rounded-r-lg rounded-l-none"
                  title="清理没有使用的镜像"
                >
                  <BrushCleaning className="h-4 w-4" />
                  <span className="ml-2">未使用</span>
                </button>
              </div>
              <button 
                onClick={toggleMultiSelectMode}
                className="btn-secondary"
              >
                批量操作
              </button>
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-3 py-2 text-sm",
                    viewMode === 'list' 
                      ? "bg-primary-600 text-white" 
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                  title="列表视图"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "px-3 py-2 text-sm",
                    viewMode === 'grid' 
                      ? "bg-primary-600 text-white" 
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                  title="网格视图"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
              </div>
              <button 
                onClick={fetchImages}
                className="btn-primary"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
          <div className="flex items-center text-red-800 dark:text-red-200">
            <span>获取镜像列表失败: {error}</span>
            <button 
              onClick={fetchImages}
              className="ml-4 px-3 py-1 bg-red-100 dark:bg-red-800 hover:bg-red-200 dark:hover:bg-red-700 rounded text-sm"
            >
              重试
            </button>
            {(error.includes('认证') || error.includes('令牌')) && (
              <button 
                onClick={handleLogout}
                className="ml-2 px-3 py-1 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-700 text-white rounded text-sm"
              >
                重新登录
              </button>
            )}
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {images.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">总镜像数</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {images.filter(img => img.inUsed).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">使用中的镜像</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {images.filter(img => img.tag === 'latest').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">最新版本</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {images.length > 0 ? (() => {
              // 计算总大小（以MB为单位）
              const totalSizeInMB = Math.round(images.reduce((sum, img) => {
                // 解析镜像大小，处理不同的单位
                const sizeStr = img.size || "0";
                const sizeValue = parseFloat(sizeStr);
                if (sizeStr.includes("Gb") || sizeStr.includes("GB")) {
                  return sum + sizeValue * 1000; // 转换为MB
                } else {
                  return sum + sizeValue;
                }
              }, 0));
              
              // 根据大小动态显示单位
              if (totalSizeInMB >= 1000) {
                // 如果总大小超过1000MB，则显示为GB
                return `${(totalSizeInMB / 1000).toFixed(1)} GB`;
              } else {
                // 否则显示为MB
                return `${totalSizeInMB} MB`;
              }
            })() : '0 MB'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">总存储空间</div>
        </div>
      </div>

      {/* 镜像列表 */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {images.map((image) => (
            <div key={image.id} className="card p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {isMultiSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(image.id)}
                      onChange={() => toggleImageSelection(image.id)}
                      className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                  )}
                  <div className="flex-shrink-0">
                    <SafeImage
                      src={getImageLogo(image.name)}
                      alt={image.name}
                      className="h-10 w-10 rounded-lg object-cover"
                      fallback={
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <HardDrive className="h-6 w-6 text-white" />
                        </div>
                      }
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {image.name}
                      </h3>
                      <span className="badge-info">{image.tag}</span>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className={cn("font-medium", getSizeColor(image.size))}>
                        大小: {formatImageSize(image.size)}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>创建: {new Date(image.createTime).toLocaleDateString()}</span>
                      </div>
                      <span className={cn(
                        "badge",
                        image.inUsed ? "badge-success" : "badge-warning"
                      )}>
                        容器: {image.inUsed ? '使用中' : '未使用'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">

                  <a
                    href={`https://hub.docker.com/r/${image.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="在Docker Hub上查看"
                    aria-label="在Docker Hub上查看"
                  >
                    <Link className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="删除镜像"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                  {image.inUsed && (
                    <button
                      onClick={() => handleDeleteImage(image.id, true)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="强制删除镜像"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // 网格视图
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image) => (
            <div key={image.id} className="card p-6 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                {isMultiSelectMode && (
                  <input
                    type="checkbox"
                    checked={selectedImages.includes(image.id)}
                    onChange={() => toggleImageSelection(image.id)}
                    className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500 mr-2"
                  />
                )}
                <div className="flex-shrink-0">
                  <SafeImage
                    src={getImageLogo(image.name)}
                    alt={image.name}
                    className="h-12 w-12 rounded-lg object-cover"
                    fallback={
                      <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <HardDrive className="h-6 w-6 text-white" />
                      </div>
                    }
                  />
                </div>
                <div className="flex items-center space-x-1 ml-auto">

                  <a
                    href={`https://hub.docker.com/r/${image.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="在Docker Hub上查看"
                    aria-label="在Docker Hub上查看"
                  >
                    <Link className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => handleDeleteImage(image.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="删除镜像"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                  {image.inUsed && (
                    <button
                      onClick={() => handleDeleteImage(image.id, true)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="强制删除镜像"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate mb-1" title={image.name}>
                  {image.name}
                </h3>
                <div className="flex items-center mb-3">
                  <span className="badge-info text-xs">{image.tag}</span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <span className={cn("font-medium", getSizeColor(image.size))}>
                      {formatImageSize(image.size)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span className="truncate">{new Date(image.createTime).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className={cn(
                      "badge text-xs",
                      image.inUsed ? "badge-success" : "badge-warning"
                    )}>
                      {image.inUsed ? '使用中' : '未使用'}
                    </span>
                  </div>
                </div>
              </div>
              
            </div>
          ))}
        </div>
      )}


    </div>
  )
}


