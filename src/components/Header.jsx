import React from 'react'
import { 
  Box, 
  HardDrive, 
  LogOut, 
  Menu, 
  X,
  Server,
  Image,
  Settings,
  DatabaseBackup,
  Palette,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle.jsx'
import { cn } from '../utils/cn.js'
import { LOGO_CONFIG } from '../assets/logo.js'

export function Sidebar({ activeTab, onTabChange, onLogout, isCollapsed = false, onToggleCollapse }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [internalCollapsed, setInternalCollapsed] = React.useState(false)
  
  // 使用外部传入的收起状态，如果没有则使用内部状态
  const sidebarCollapsed = onToggleCollapse ? isCollapsed : internalCollapsed
  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse()
    } else {
      setInternalCollapsed(!internalCollapsed)
    }
  }

  const navItems = [
    {
      id: '#containers',
      label: '容器',
      icon: Server,
    },
    {
      id: '#images',
      label: '镜像',
      icon: Box,
    },    
    {
      id: '#backups',
      label: '备份',
      icon: DatabaseBackup,
    },
    {
      id: '#icons',
      label: '图标',
      icon: Palette,
    },
    {
      id: '#settings',
      label: '设置',
      icon: Settings,
    },
  ]

  return (
    <>
      {/* 移动端菜单按钮 */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md"
      >
        <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
      </button>

      {/* 侧边栏遮罩 */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside 
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-lg lg:shadow-none transform transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-20" : "w-64",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <img 
                {...LOGO_CONFIG}
              />
              {!sidebarCollapsed && (
                <div className="transition-opacity duration-300">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">Docker Copilot</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">容器管理平台</p>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {/* 桌面端收起按钮 */}
              <button
                onClick={handleToggleCollapse}
                className="hidden lg:block p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
              {/* 移动端关闭按钮 */}
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className={cn("flex-1 py-6", sidebarCollapsed ? "px-2" : "px-4")}>
            <ul className={cn("space-y-1", sidebarCollapsed ? "space-y-8" : "space-y-1")}>
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onTabChange(item.id)
                        setIsMobileMenuOpen(false)
                      }}
                      className={cn(
                        "w-full flex items-center rounded-xl text-left transition-all duration-200 group",
                        sidebarCollapsed ? "justify-center px-2 py-3" : "space-x-3 px-4 py-4",
                        activeTab === item.id
                          ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className={cn("flex-shrink-0", sidebarCollapsed ? "h-6 w-6" : "h-5 w-5")} />
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* 底部 */}
          <div className={cn("border-t border-gray-200 dark:border-gray-700", sidebarCollapsed ? "p-2" : "p-4")}>
            {/* 操作按钮区域 */}
            <div className={cn(
              "flex items-center gap-2",
              sidebarCollapsed ? "flex-col" : "justify-between"
            )}>
              {/* 主题切换按钮 */}
              <div className={cn(
                "flex items-center justify-center",
                sidebarCollapsed ? "w-full" : ""
              )}>
                <ThemeToggle collapsed={sidebarCollapsed} />
              </div>
              
              {/* 退出登录按钮 */}
              <button
                onClick={onLogout}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg transition-all duration-200 group",
                  sidebarCollapsed ? "w-full p-2" : "flex-1"
                )}
                title={sidebarCollapsed ? "退出登录" : ""}
              >
                <LogOut className="h-4 w-4 flex-shrink-0 group-hover:rotate-12 transition-transform duration-200" />
                {!sidebarCollapsed && (
                  <span className="text-sm font-medium">退出</span>
                )}
              </button>
            </div>
            {!sidebarCollapsed && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                <p>Docker Copilot v1.0</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}