"use client"

import { useState, useEffect } from "react"
import { getWordCountByLevel, getLevelsWithCount } from "@/lib/supabase"
import Link from "next/link"

// 定义级别信息类型
interface LevelInfo {
  code: string
  name: string
  description: string
  color: string
}

export default function LevelCountsPage() {
  const [levelCounts, setLevelCounts] = useState<Record<string, number>>({})
  const [allLevels, setAllLevels] = useState<LevelInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  // 动态生成级别信息
  const generateLevelInfo = (level: string): LevelInfo => {
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

  // 添加调试日志的函数
  const addLog = (message: string) => {
    setDebugInfo((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  useEffect(() => {
    async function fetchAllLevelCounts() {
      try {
        setIsLoading(true)
        addLog("开始查询所有级别单词数量...")

        // 方法1: 使用 getLevelsWithCount 函数获取所有级别的单词数量
        addLog("方法1: 使用 getLevelsWithCount 函数")
        const allLevelCounts = await getLevelsWithCount()

        // 根据实际数据生成级别信息
        const dynamicLevels = allLevelCounts
          .map((item) => generateLevelInfo(item.level))
          .sort((a, b) => a.code.localeCompare(b.code))

        setAllLevels(dynamicLevels)

        // 转换为对象格式，方便查找
        const countsFromMethod1: Record<string, number> = {}
        allLevelCounts.forEach((item) => {
          countsFromMethod1[item.level.toUpperCase()] = item.count
        })

        addLog(`方法1结果: ${JSON.stringify(countsFromMethod1)}`)

        // 方法2: 使用 getWordCountByLevel 函数分别查询每个级别
        addLog("方法2: 使用 getWordCountByLevel 函数分别查询每个级别")
        const countsFromMethod2: Record<string, number> = {}

        // 并行查询所有级别
        const promises = dynamicLevels.map(async (level) => {
          const count = await getWordCountByLevel(level.code)
          addLog(`方法2: ${level.name} 有 ${count} 个单词`)
          return { level: level.code, count }
        })

        const results = await Promise.all(promises)

        results.forEach((result) => {
          countsFromMethod2[result.level.toUpperCase()] = result.count
        })

        addLog(`方法2结果: ${JSON.stringify(countsFromMethod2)}`)

        // 合并两种方法的结果，取较大值
        const finalCounts: Record<string, number> = {}
        dynamicLevels.forEach((level) => {
          const code = level.code.toUpperCase()
          const count1 = countsFromMethod1[code] || 0
          const count2 = countsFromMethod2[code] || 0
          finalCounts[code] = Math.max(count1, count2)
        })

        addLog(`最终结果: ${JSON.stringify(finalCounts)}`)
        setLevelCounts(finalCounts)
        setError("")
      } catch (err) {
        console.error("查询级别单词数量失败:", err)
        addLog(`查询失败: ${err instanceof Error ? err.message : String(err)}`)
        setError("查询级别单词数量失败，请稍后再试")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllLevelCounts()
  }, [])

  // 计算总单词数
  const totalWords = Object.values(levelCounts).reduce((sum, count) => sum + count, 0)

  return (
    <div className="gradient-bg w-full min-h-screen p-16 flex flex-col">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center">
          <Link href="/" className="rounded-full p-2 text-black">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h2 className="text-3xl font-bold ml-4 text-black">单词库数量统计</h2>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center">
        <div className="bg-white rounded-3xl shadow-lg p-12 w-full max-w-4xl mb-8">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-3xl text-black mb-4">正在查询单词数量...</div>
              <div className="animate-pulse bg-gray-200 h-12 w-32 mx-auto rounded-lg"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-2xl text-red-500 mb-4">{error}</div>
              <button onClick={() => window.location.reload()} className="bg-black text-white px-6 py-3 rounded-xl">
                重试
              </button>
            </div>
          ) : (
            <div className="py-8">
              <h3 className="text-2xl text-center font-bold text-black mb-8">单词库数量统计</h3>

              {/* 总单词数 */}
              <div className="text-center mb-8">
                <div className="text-lg text-gray-600 mb-2">总单词数</div>
                <div className="text-5xl font-bold text-black">{totalWords}</div>
              </div>

              {/* 各级别单词数量 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {allLevels.map((level) => {
                  const count = levelCounts[level.code.toUpperCase()] || 0
                  const percentage = totalWords > 0 ? Math.round((count / totalWords) * 100) : 0

                  return (
                    <div key={level.code} className={`${level.color} rounded-xl p-6 text-center`}>
                      <div className="text-xl font-bold text-black mb-1">{level.name}</div>
                      <div className="text-sm text-gray-600 mb-3">{level.description}</div>
                      <div className="text-4xl font-bold text-black">{count}</div>
                      <div className="text-sm text-gray-600 mt-1">{percentage}% 的单词</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 调试信息 */}
        <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-4xl">
          <h3 className="text-xl font-bold mb-4 text-black">查询过程日志</h3>
          <div className="bg-gray-100 p-4 rounded-xl max-h-80 overflow-y-auto">
            {debugInfo.length > 0 ? (
              debugInfo.map((log, index) => (
                <div key={index} className="mb-1 text-sm font-mono">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-center">暂无日志</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
