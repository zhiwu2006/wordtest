"use client"

import { useState, useEffect } from "react"
import { getLevelsWithCount, type LevelCount, type DictionaryWord, isUsingMockData } from "@/lib/supabase"

// 将级别代码转换为显示文本
const getLevelDisplay = (level: string): string => {
  return `${level} 级`
}

// 为了区分两种不同的用途，我们创建两个不同的接口
interface WordLevelStatsProps {
  mode?: "levels"
}

interface WordTestStatsProps {
  mode: "test"
  correctWords: DictionaryWord[]
  incorrectWords: DictionaryWord[]
  onBack: () => void
  onRetestIncorrect: () => void
}

// 合并两种接口为一个联合类型
type WordStatsProps = WordLevelStatsProps | WordTestStatsProps

export default function WordStats(props: WordStatsProps) {
  // 如果是测试模式，显示测试结果统计
  if (props.mode === "test") {
    return <WordTestStats {...props} />
  }

  // 否则显示难度级别统计（默认模式）
  return <WordLevelStats />
}

// 难度级别统计组件
function WordLevelStats() {
  const [levelCounts, setLevelCounts] = useState<LevelCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [totalWords, setTotalWords] = useState(0)
  const [usingMockData, setUsingMockData] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [rawData, setRawData] = useState<string>("")

  // 预定义所有难度级别
  const allLevels = [
    { code: "A", name: "A 级", description: "入门级", color: "bg-green-100" },
    { code: "B", name: "B 级", description: "初级", color: "bg-blue-100" },
    { code: "C", name: "C 级", description: "中级", color: "bg-yellow-100" },
    { code: "D", name: "D 级", description: "高级", color: "bg-orange-100" },
    { code: "E", name: "E 级", description: "专家级", color: "bg-red-100" },
  ]

  useEffect(() => {
    let isMounted = true

    async function loadLevelCounts() {
      try {
        console.log("开始加载单词统计数据")
        setIsLoading(true)

        const data = await getLevelsWithCount()

        if (!isMounted) return

        console.log("获取到的单词统计数据:", data)

        // 收集调试信息
        const debugText = `获取到的级别: ${data.map((item) => `${item.level}(${item.count})`).join(", ")}`
        setDebugInfo(debugText)
        setRawData(JSON.stringify(data, null, 2))

        setLevelCounts(data)
        setUsingMockData(isUsingMockData)

        // 计算总单词数
        const total = data.reduce((sum, item) => sum + item.count, 0)
        setTotalWords(total)
        console.log("总单词数:", total)

        setError("")
      } catch (err) {
        console.error("加载单词统计失败:", err)
        if (isMounted) {
          setError("加载单词统计失败，请稍后再试")
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-2xl text-black">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-2xl text-black">{error}</div>
      </div>
    )
  }

  // 获取每个级别的单词数量
  const getWordCount = (level: string): number => {
    // 精确匹配级别代码
    const levelData = levelCounts.find((item) => item.level === level)
    return levelData ? levelData.count : 0
  }

  // 获取每个级别占总数的百分比
  const getPercentage = (level: string): number => {
    if (totalWords === 0) return 0
    return Math.round((getWordCount(level) / totalWords) * 100)
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 w-full">
      <h2 className="text-3xl font-bold mb-6 text-black">单词库统计</h2>

      {usingMockData && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-xl text-black">
          <p className="font-bold">注意：当前显示的是模拟数据</p>
          <p className="text-sm">无法连接到数据库，请检查网络连接和环境变量设置</p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xl text-black">总单词数</span>
          <span className="text-xl font-bold text-black">{totalWords}</span>
        </div>
      </div>

      {/* 调试信息 */}
      {debugInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl text-black text-sm">
          <p className="font-bold">调试信息:</p>
          <p>{debugInfo}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-600">查看原始数据</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">{rawData}</pre>
          </details>
        </div>
      )}

      <div className="space-y-6">
        {allLevels.map((level) => {
          const wordCount = getWordCount(level.code)
          const percentage = getPercentage(level.code)

          return (
            <div key={level.code} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${level.color} mr-2`}></div>
                  <span className="text-black">
                    {level.name} <span className="text-xs text-black text-opacity-70">({level.description})</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-black font-bold">{wordCount}</span>
                  <span className="text-black text-opacity-70 ml-2">({percentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className={`${level.color} rounded-full h-3`} style={{ width: `${percentage}%` }}></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 测试结果统计组件
function WordTestStats({ correctWords, incorrectWords, onBack, onRetestIncorrect }: WordTestStatsProps) {
  const [activeTab, setActiveTab] = useState<"correct" | "incorrect">("incorrect")

  // 计算正确率
  const totalWords = correctWords.length + incorrectWords.length
  const correctRate = totalWords > 0 ? Math.round((correctWords.length / totalWords) * 100) : 0

  // 处理重新测试错误单词
  const handleRetestIncorrect = () => {
    console.log("WordStats: 点击重新测试错误单词按钮，错误单词数量:", incorrectWords.length)

    // 直接调用父组件传入的回调函数，不传递参数
    onRetestIncorrect()
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-black">学习统计</h2>
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isUsingMockData && (
        <div className="mb-6 p-4 bg-yellow-100 rounded-xl text-black">
          <p className="font-bold">注意：当前使用的是模拟数据</p>
          <p className="text-sm">无法连接到数据库，请检查网络连接和环境变量设置</p>
        </div>
      )}

      {/* 总体统计 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-100 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-black">{totalWords}</div>
          <div className="text-sm text-black">总单词数</div>
        </div>
        <div className="bg-green-100 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{correctWords.length}</div>
          <div className="text-sm text-black">正确</div>
        </div>
        <div className="bg-red-100 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{incorrectWords.length}</div>
          <div className="text-sm text-black">错误</div>
        </div>
        <div className="bg-blue-100 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{correctRate}%</div>
          <div className="text-sm text-black">正确率</div>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "incorrect" ? "text-red-600 border-b-2 border-red-600" : "text-black hover:text-red-600"
          }`}
          onClick={() => setActiveTab("incorrect")}
        >
          错误单词 ({incorrectWords.length})
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "correct" ? "text-green-600 border-b-2 border-green-600" : "text-black hover:text-green-600"
          }`}
          onClick={() => setActiveTab("correct")}
        >
          正确单词 ({correctWords.length})
        </button>
      </div>

      {/* 单词列表 */}
      <div className="mb-8 max-h-96 overflow-y-auto">
        {activeTab === "incorrect" ? (
          incorrectWords.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incorrectWords.map((word, index) => (
                <div key={index} className="bg-red-50 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <div className="text-xl font-bold text-black">{word.word}</div>
                    <div className="text-sm text-black">{word.translation}</div>
                  </div>
                  <div className="text-xs bg-red-100 px-2 py-1 rounded-full text-red-600">
                    {getLevelDisplay(word.level)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">太棒了！没有错误的单词</div>
          )
        ) : correctWords.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {correctWords.map((word, index) => (
              <div key={index} className="bg-green-50 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <div className="text-xl font-bold text-black">{word.word}</div>
                  <div className="text-sm text-black">{word.translation}</div>
                </div>
                <div className="text-xs bg-green-100 px-2 py-1 rounded-full text-green-600">
                  {getLevelDisplay(word.level)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">还没有正确的单词，继续加油！</div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border-2 border-black rounded-xl text-black font-medium hover:bg-gray-100 transition-colors"
        >
          返回测试
        </button>

        {incorrectWords.length > 0 && (
          <button
            onClick={handleRetestIncorrect}
            className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            重新测试错误单词 ({incorrectWords.length})
          </button>
        )}
      </div>
    </div>
  )
}
