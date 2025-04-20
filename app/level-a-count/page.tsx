"use client"

import { useState, useEffect } from "react"
import { getWordCountByLevel, getLevelsWithCount } from "@/lib/supabase"
import Link from "next/link"

export default function LevelACountPage() {
  const [count, setCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  // 添加调试日志的函数
  const addLog = (message: string) => {
    setDebugInfo((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  useEffect(() => {
    async function fetchLevelACount() {
      try {
        setIsLoading(true)
        addLog("开始查询 A 级别单词数量...")

        // 方法1: 使用 getWordCountByLevel 函数
        addLog("方法1: 使用 getWordCountByLevel 函数")
        const directCount = await getWordCountByLevel("A")
        addLog(`方法1结果: A 级别有 ${directCount} 个单词`)

        // 方法2: 使用 getLevelsWithCount 函数
        addLog("方法2: 使用 getLevelsWithCount 函数")
        const allLevelCounts = await getLevelsWithCount()
        const levelAData = allLevelCounts.find((item) => item.level.toUpperCase() === "A")
        const levelACount = levelAData ? levelAData.count : 0
        addLog(`方法2结果: A 级别有 ${levelACount} 个单词`)

        // 使用两种方法中较大的值作为结果
        const finalCount = Math.max(directCount, levelACount)
        addLog(`最终结果: A 级别有 ${finalCount} 个单词`)

        setCount(finalCount)
        setError("")
      } catch (err) {
        console.error("查询 A 级别单词数量失败:", err)
        addLog(`查询失败: ${err instanceof Error ? err.message : String(err)}`)
        setError("查询 A 级别单词数量失败，请稍后再试")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLevelACount()
  }, [])

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
          <h2 className="text-3xl font-bold ml-4 text-black">A 级别单词数量查询</h2>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-white rounded-3xl shadow-lg p-12 w-full max-w-2xl">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-3xl text-black mb-4">正在查询 A 级别单词数量...</div>
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
            <div className="text-center py-8">
              <h3 className="text-2xl text-black mb-6">A 级别单词数量</h3>
              <div className="text-7xl font-bold text-black mb-8">{count}</div>
              <p className="text-gray-600">
                数据库中共有 <span className="font-bold">{count}</span> 个 A 级别的单词
              </p>
            </div>
          )}
        </div>

        {/* 调试信息 */}
        <div className="mt-12 bg-white rounded-3xl shadow-lg p-8 w-full max-w-2xl">
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
