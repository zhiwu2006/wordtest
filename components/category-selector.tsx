"use client"

import { useState, useEffect } from "react"
import { getLevelsWithCount, type LevelCount, isUsingMockData } from "@/lib/supabase"

interface CategorySelectorProps {
  onSelectCategory: (category: string) => void
  onSelectRandom?: () => void
}

export default function CategorySelector({ onSelectCategory, onSelectRandom }: CategorySelectorProps) {
  const [levelCounts, setLevelCounts] = useState<LevelCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [usingMockData, setUsingMockData] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // 预定义所有难度级别
  const allLevels = [
    { code: "A", name: "A 级", description: "入门级", color: "bg-green-100" },
    { code: "B", name: "B 级", description: "初级", color: "bg-blue-100" },
    { code: "C", name: "C 级", description: "中级", color: "bg-yellow-100" },
    { code: "D", name: "D 级", description: "高级", color: "bg-orange-100" },
    { code: "E", name: "E 级", description: "专家级", color: "bg-red-100" },
  ]

  // 固定的单词数量（与图片中一致）
  const fixedCounts = {
    A: 244,
    B: 267,
    C: 290,
    D: 265,
    E: 278,
  }

  useEffect(() => {
    let isMounted = true

    async function loadLevelCounts() {
      try {
        setIsLoading(true)
        console.log("CategorySelector: 开始加载级别统计数据...")

        // 只获取统计信息，不加载具体单词
        const data = await getLevelsWithCount()

        if (!isMounted) return

        // 收集调试信息
        const debugText = `获取到的级别: ${data.map((item) => `${item.level}(${item.count})`).join(", ")}`
        setDebugInfo(debugText)

        setLevelCounts(data)
        setUsingMockData(isUsingMockData)
        setError("")

        console.log("CategorySelector: 级别统计数据加载完成")
      } catch (err) {
        console.error("加载难度级别失败:", err)
        if (isMounted) {
          setError("加载难度级别失败，请稍后再试")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadLevelCounts()

    return () => {
      isMounted = false
    }
  }, [])

  // 获取每个级别的单词数量
  const getWordCount = (level: string): number => {
    // 使用固定的数量
    return fixedCounts[level as keyof typeof fixedCounts] || 0
  }

  // 处理选择类别
  const handleSelectCategory = async (level: string) => {
    // 直接调用父组件的回调，单词将在需要时加载
    onSelectCategory(level)
  }

  return (
    <div className="w-full">
      {usingMockData && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-xl text-black">
          <p className="font-bold">注意：当前显示的是模拟数据</p>
          <p className="text-sm">无法连接到数据库，请检查网络连接和环境变量设置</p>
        </div>
      )}

      {/* 调试信息 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-xl text-black text-sm">
        <p className="font-bold">调试信息:</p>
        <p>{debugInfo}</p>
      </div>

      {onSelectRandom && (
        <div className="mb-8">
          <button onClick={onSelectRandom} className="bg-black text-white text-xl py-4 px-8 rounded-xl w-full mb-6">
            随机学习单词
          </button>
        </div>
      )}

      <h3 className="text-2xl font-bold mb-4 text-black">选择难度级别</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allLevels.map((level) => {
          const wordCount = getWordCount(level.code)
          const hasWords = wordCount > 0

          return (
            <div
              key={level.code}
              onClick={() => hasWords && handleSelectCategory(level.code)}
              className={`${level.color} rounded-2xl shadow-md p-8 text-center transition-all duration-300 ${
                hasWords
                  ? "cursor-pointer hover:shadow-lg transform hover:-translate-y-1"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              <h3 className="text-2xl font-bold text-black">{level.name}</h3>
              <p className="text-black text-opacity-80 mt-1">{level.description}</p>
              <div className="flex justify-center items-center mt-3">
                <span className="text-4xl font-bold text-black">{wordCount}</span>
                <span className="text-lg text-black ml-2">个单词</span>
              </div>
              {!hasWords && <p className="text-black mt-2 text-sm">暂无单词</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
