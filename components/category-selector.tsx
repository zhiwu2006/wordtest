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

  // 动态生成级别信息
  const generateLevelInfo = (level: string) => {
    const levelDescriptions: Record<string, string> = {
      A: "入门级",
      B: "初级",
      C: "中级",
      D: "高级",
      E: "专家级",
      F: "大师级",
      G: "传奇级",
      H: "史诗级",
      I: "神话级",
      J: "至尊级",
    }

    const levelColors = [
      "bg-green-100",
      "bg-blue-100",
      "bg-yellow-100",
      "bg-orange-100",
      "bg-red-100",
      "bg-purple-100",
      "bg-pink-100",
      "bg-indigo-100",
      "bg-teal-100",
      "bg-gray-100",
    ]

    const levelIndex = level.charCodeAt(0) - 65 // A=0, B=1, C=2, etc.
    const colorIndex = levelIndex % levelColors.length

    return {
      code: level,
      name: `${level} 级`,
      description: levelDescriptions[level] || "高难度",
      color: levelColors[colorIndex],
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadLevelCounts() {
      try {
        setIsLoading(true)
        console.log("CategorySelector: 开始加载级别统计数据...")

        // 获取统计信息
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

  // 根据实际数据生成级别信息
  const allLevels = levelCounts
    .map((item) => generateLevelInfo(item.level))
    .sort((a, b) => a.code.localeCompare(b.code)) // 按字母顺序排序

  // 获取每个级别的单词数量
  const getWordCount = (level: string): number => {
    const levelData = levelCounts.find((item) => item.level.toUpperCase() === level.toUpperCase())
    return levelData ? levelData.count : 0
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
