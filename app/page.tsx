"use client"

import { useState, useEffect } from "react"
import { getLevelsWithCount, type LevelCount, isUsingMockData } from "@/lib/supabase"
import Link from "next/link"

export default function Home() {
  const [levelCounts, setLevelCounts] = useState<LevelCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [usingMockData, setUsingMockData] = useState(false)

  useEffect(() => {
    async function loadLevelStats() {
      try {
        console.log("首页: 开始加载单词库统计数据...")
        setIsLoading(true)

        // 直接从数据库查询各级别单词数量
        const data = await getLevelsWithCount()

        console.log("首页: 获取到单词库统计数据:", data)
        setLevelCounts(data)
        setUsingMockData(isUsingMockData)
        setError("")
      } catch (err) {
        console.error("首页: 加载单词库统计失败:", err)
        setError("加载单词库统计失败，请稍后再试")
      } finally {
        setIsLoading(false)
      }
    }

    loadLevelStats()
  }, [])

  return (
    <div className="gradient-bg w-full min-h-screen p-16 flex flex-col">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h1 className="text-5xl font-bold ml-4 text-black">单词星球</h1>
        </div>
        <Link href="/settings" className="rounded-full p-3 text-black">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </header>

      <div className="flex-1 flex flex-col md:flex-row gap-12">
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <h2 className="text-6xl font-bold mb-8 text-black">
            快乐学习，
            <br />
            轻松记单词！
          </h2>
          <p className="text-2xl mb-12 text-black">专为儿童设计的单词学习应用，通过有趣的方式提高词汇量</p>

          <div className="flex flex-col sm:flex-row gap-6">
            <Link
              href="/learn"
              className="bg-black text-white text-2xl py-6 px-12 rounded-full shadow-lg flex items-center justify-center pulse-animation"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              开始学习
            </Link>

            <Link
              href="/settings"
              className="border-2 border-black text-black text-2xl py-6 px-12 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              导入单词
            </Link>
          </div>
        </div>

        <div className="w-full md:w-1/2">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-2xl text-black">加载单词库统计中...</div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-3xl shadow-lg p-8 w-full">
              <div className="text-xl text-red-500">{error}</div>
            </div>
          ) : (
            <HomeWordStats levelCounts={levelCounts} usingMockData={usingMockData} />
          )}
        </div>
      </div>
    </div>
  )
}

// 首页专用的单词统计组件
function HomeWordStats({ levelCounts, usingMockData }: { levelCounts: LevelCount[]; usingMockData: boolean }) {
  // 动态生成级别信息，根据数据库中实际存在的级别
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

  // 根据实际数据生成级别信息
  const allLevels = levelCounts
    .map((item) => generateLevelInfo(item.level))
    .sort((a, b) => a.code.localeCompare(b.code)) // 按字母顺序排序

  // 计算总单词数
  const totalWords = levelCounts.reduce((sum, item) => sum + item.count, 0)

  // 获取每个级别的单词数量
  const getWordCount = (level: string): number => {
    const levelData = levelCounts.find((item) => item.level.toUpperCase() === level.toUpperCase())
    return levelData ? levelData.count : 0
  }

  // 获取每个级别占总数的百分比
  const getPercentage = (level: string): number => {
    if (totalWords === 0) return 0
    return Math.round((getWordCount(level) / totalWords) * 100)
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-black">单词库数量统计</h2>
        <Link href="/level-counts" className="text-sm text-blue-600 hover:underline">
          查看详细统计
        </Link>
      </div>

      {usingMockData && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-xl text-black">
          <p className="font-bold">注意：当前显示的是模拟数据</p>
          <p className="text-sm">无法连接到数据库，请检查网络连接和环境变量设置</p>
        </div>
      )}

      {/* 总单词数 */}
      <div className="text-center mb-8">
        <div className="text-lg text-gray-600 mb-2">总单词数</div>
        <div className="text-5xl font-bold text-black">{totalWords}</div>
      </div>

      {/* 各级别单词数量 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allLevels.map((level) => {
          const count = getWordCount(level.code)
          const percentage = getPercentage(level.code)

          return (
            <div key={level.code} className={`${level.color} rounded-xl p-4 text-center`}>
              <div className="text-lg font-bold text-black mb-1">{level.name}</div>
              <div className="text-xs text-gray-600 mb-2">{level.description}</div>
              <div className="text-3xl font-bold text-black mb-1">{count}</div>
              <div className="text-xs text-gray-600">{percentage}% 的单词</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
