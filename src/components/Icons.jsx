import React, { useState, useEffect } from 'react'
import { Search, Copy, Download, Eye, Grid, List, Star, Filter, Check, X } from 'lucide-react'
import { cn } from '../utils/cn.js'
import { builtInImageLogos, getSupportedImageNames } from '../config/imageLogos.js'

export function Icons() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' 或 'list'
  const [copiedIcon, setCopiedIcon] = useState(null)
  const [selectedIcon, setSelectedIcon] = useState(null)
  const [favorites, setFavorites] = useState([])

  // 从localStorage加载收藏
  useEffect(() => {
    const savedFavorites = localStorage.getItem('docker_copilot_icon_favorites')
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (e) {
        console.error('解析收藏数据失败:', e)
      }
    }
  }, [])

  // 保存收藏到localStorage
  const saveFavorites = (newFavorites) => {
    setFavorites(newFavorites)
    localStorage.setItem('docker_copilot_icon_favorites', JSON.stringify(newFavorites))
  }

  // 切换收藏状态
  const toggleFavorite = (iconName) => {
    const newFavorites = favorites.includes(iconName)
      ? favorites.filter(name => name !== iconName)
      : [...favorites, iconName]
    saveFavorites(newFavorites)
  }

  // 复制图标URL到剪贴板
  const copyToClipboard = async (url, iconName) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedIcon(iconName)
      setTimeout(() => setCopiedIcon(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 获取所有分类
  const getCategories = () => {
    const categories = new Set(['all'])
    Object.keys(builtInImageLogos).forEach(key => {
      const url = builtInImageLogos[key]
      if (url.includes('/docker/')) categories.add('docker')
      else if (url.includes('/nas/')) categories.add('nas')
      else if (url.includes('/pt/')) categories.add('pt')
      else if (url.includes('/cloud/')) categories.add('cloud')
      else if (url.includes('/website/')) categories.add('website')
    })
    return Array.from(categories)
  }

  // 过滤图标
  const getFilteredIcons = () => {
    let icons = Object.entries(builtInImageLogos)
    
    // 按分类过滤
    if (selectedCategory !== 'all') {
      icons = icons.filter(([name, url]) => {
        switch (selectedCategory) {
          case 'docker':
            return url.includes('/docker/')
          case 'nas':
            return url.includes('/nas/')
          case 'pt':
            return url.includes('/pt/')
          case 'cloud':
            return url.includes('/cloud/')
          case 'website':
            return url.includes('/website/')
          case 'favorites':
            return favorites.includes(name)
          default:
            return true
        }
      })
    }
    
    // 按搜索词过滤
    if (searchTerm) {
      icons = icons.filter(([name]) => 
        name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return icons
  }

  const filteredIcons = getFilteredIcons()
  const categories = getCategories()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">图标库</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            浏览和管理Docker镜像图标，支持搜索和收藏
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === 'grid' 
                ? "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === 'list' 
                ? "bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300" 
                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            )}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* 搜索框 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索图标名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* 分类过滤 */}
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? '全部分类' : 
                 category === 'docker' ? 'Docker应用' :
                 category === 'nas' ? 'NAS系统' :
                 category === 'pt' ? 'PT站点' :
                 category === 'cloud' ? '云服务商' :
                 category === 'website' ? '网站服务' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          共找到 {filteredIcons.length} 个图标
          {favorites.length > 0 && `，已收藏 ${favorites.length} 个`}
        </div>
        {favorites.length > 0 && (
          <button
            onClick={() => setSelectedCategory('favorites')}
            className={cn(
              "px-3 py-1 text-sm rounded-full transition-colors",
              selectedCategory === 'favorites'
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            )}
          >
            <Star className="inline h-4 w-4 mr-1" />
            收藏 ({favorites.length})
          </button>
        )}
      </div>

      {/* 图标列表 */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {filteredIcons.map(([name, url]) => (
            <div key={name} className="card p-4 hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="relative">
                <img
                  src={url}
                  alt={name}
                  className="w-full h-16 object-contain rounded-lg mb-2"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMzIgMTZMNDEgMzBIMzNWMzhIMzFWMzBIMjNMMzIgMTZaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='
                  }}
                  onClick={() => setSelectedIcon({ name, url })}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(name)
                  }}
                  className="absolute top-0 right-0 p-1 rounded-full bg-white dark:bg-gray-800 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Star 
                    className={cn(
                      "h-4 w-4",
                      favorites.includes(name) 
                        ? "text-yellow-500 fill-current" 
                        : "text-gray-400 hover:text-yellow-500"
                    )} 
                  />
                </button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 truncate font-medium">
                {name}
              </div>
              <div className="flex items-center justify-between mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(url, name)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  title="复制链接"
                >
                  {copiedIcon === name ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(url, '_blank')
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
                  title="查看原图"
                >
                  <Eye className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredIcons.map(([name, url]) => (
            <div key={name} className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={url}
                    alt={name}
                    className="w-12 h-12 object-contain rounded-lg"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iI0YzRjRGNiIvPgo8cGF0aCBkPSJNMzIgMTZMNDEgMzBIMzNWMzhIMzFWMzBIMjNMMzIgMTZaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo='
                    }}
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                      {url}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleFavorite(name)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Star 
                      className={cn(
                        "h-5 w-5",
                        favorites.includes(name) 
                          ? "text-yellow-500 fill-current" 
                          : "text-gray-400 hover:text-yellow-500"
                      )} 
                    />
                  </button>
                  <button
                    onClick={() => copyToClipboard(url, name)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {copiedIcon === name ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <Copy className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => window.open(url, '_blank')}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 图标详情弹窗 */}
      {selectedIcon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  图标详情
                </h3>
                <button
                  onClick={() => setSelectedIcon(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={selectedIcon.url}
                    alt={selectedIcon.name}
                    className="w-32 h-32 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    图标名称
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                    {selectedIcon.name}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    图标链接
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={selectedIcon.url}
                      readOnly
                      className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(selectedIcon.url, selectedIcon.name)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {copiedIcon === selectedIcon.name ? '已复制' : '复制'}
                    </button>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => window.open(selectedIcon.url, '_blank')}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    在新窗口打开
                  </button>
                  <button
                    onClick={() => {
                      toggleFavorite(selectedIcon.name)
                      setSelectedIcon(null)
                    }}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg transition-colors",
                      favorites.includes(selectedIcon.name)
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    )}
                  >
                    {favorites.includes(selectedIcon.name) ? '取消收藏' : '添加收藏'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {filteredIcons.length === 0 && (
        <div className="text-center py-12">
          <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            没有找到图标
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            尝试调整搜索词或分类过滤器
          </p>
        </div>
      )}
    </div>
  )
}