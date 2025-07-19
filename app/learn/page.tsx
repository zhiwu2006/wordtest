"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { type DictionaryWord, getWordsByCategory, getRandomWords, getLevelsWithCount } from "@/lib/supabase"
import CategorySelector from "@/components/category-selector"
import WordTest from "@/components/word-test"
import Settings from "@/components/settings"

export default function LearnPage() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isRandomMode, setIsRandomMode] = useState(false)
  const [words, setWords] = useState<DictionaryWord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    timeLimit: 2, // 默认2秒
    wordCount: 20, // 默认20个单词
  })
  const [isTestComplete, setIsTestComplete] = useState(false)
  const [incorrectWords, setIncorrectWords] = useState<DictionaryWord[]>([])
  const [isRetestMode, setIsRetestMode] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [categoryWordCount, setCategoryWordCount] = useState<number | null>(null)

  // 从本地存储加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem("wordAppSettings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error("Failed to parse settings:", e)
      }
    }
  }, [])

  // 当选择类别时，获取该类别的单词总数
  useEffect(() => {
    const fetchWordCount = async () => {
      if (selectedCategory) {
        setIsLoading(true)
        try {
          const allCounts = await getLevelsWithCount()
          const levelData = allCounts.find((l) => l.level === selectedCategory)
          setCategoryWordCount(levelData ? levelData.count : 0)
        } catch (error) {
          console.error("Failed to fetch word count for category:", error)
          setCategoryWordCount(0)
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchWordCount()
  }, [selectedCategory])

  // 加载单词 - 仅在需要时加载
  const loadWords = useCallback(async () => {
    // 如果是重新测试模式，使用已有的错误单词
    if (isRetestMode) {
      console.log("重新测试模式，使用错误单词:", incorrectWords.length)
      setWords([...incorrectWords]) // 确保单词状态被设置
      return
    }

    setIsLoading(true)
    try {
      let wordsData: DictionaryWord[] = []

      if (isRandomMode) {
        console.log("随机模式，加载单词")
        wordsData = await getRandomWords(settings.wordCount)
      } else if (selectedCategory) {
        console.log("分类模式，加载单词:", selectedCategory)
        // 只加载需要的单词数量
        wordsData = await getWordsByCategory(selectedCategory, settings.wordCount)
      } else {
        console.log("没有选择模式，不加载单词")
        setIsLoading(false)
        return
      }

      console.log("加载单词成功:", wordsData.length)
      setWords(wordsData)
    } catch (err) {
      console.error("加载单词失败:", err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, isRandomMode, settings.wordCount, isRetestMode, incorrectWords])

  // 处理开始学习按钮点击
  const handleStartLearning = () => {
    loadWords()
  }

  // 处理分类选择
  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category)
    setIsRandomMode(false)
    setIsRetestMode(false)
    setIncorrectWords([])
    setIsTestComplete(false)
    setWords([]) // 清空已加载的单词
    setCategoryWordCount(null) // 重置单词数量，等待useEffect重新获取
  }

  // 处理随机模式
  const handleSelectRandom = () => {
    setSelectedCategory(null)
    setIsRandomMode(true)
    setIsRetestMode(false)
    setIncorrectWords([])
    setIsTestComplete(false)
    setWords([]) // 清空已加载的单词
    setCategoryWordCount(null) // 重置单词数量
  }

  // 处理设置保存
  const handleSaveSettings = (newSettings: { timeLimit: number; wordCount: number }) => {
    // 确保设置在有效范围内
    const validatedSettings = {
      timeLimit: Math.max(0.1, newSettings.timeLimit), // 至少0.1秒
      wordCount: Math.min(1000, Math.max(1, newSettings.wordCount)), // 1-1000之间
    }

    setSettings(validatedSettings)
    localStorage.setItem("wordAppSettings", JSON.stringify(validatedSettings))
    setShowSettings(false)
  }

  // 处理测试完成
  const handleTestComplete = () => {
    console.log("测试完成，显示统计数据")
    setIsTestComplete(true)
  }

  // 返回分类选择
  const handleBackToCategories = () => {
    setSelectedCategory(null)
    setIsRandomMode(false)
    setIsRetestMode(false)
    setIsTestComplete(false)
    setIncorrectWords([])
    setWords([])
    setCategoryWordCount(null)
  }

  // 重新开始测试
  const handleRestartTest = () => {
    setIsTestComplete(false)
    loadWords() // 重新加载单词
  }

  // 重新测试错误的单词
  const handleRetestIncorrect = useCallback(
    (wrongWords?: DictionaryWord[]) => {
      console.log("开始重新测试错误单词")

      // 使用传入的错误单词，或者使用当前状态中的错误单词
      const wordsToRetest = wrongWords || incorrectWords

      if (wordsToRetest && wordsToRetest.length > 0) {
        console.log(`准备重新测试 ${wordsToRetest.length} 个错误单词`)

        // 直接设置为重新测试模式
        setIsRetestMode(true)

        // 设置错误单词为当前测试单词
        setWords([...wordsToRetest])

        // 更新错误单词状态
        setIncorrectWords([...wordsToRetest])

        // 重置其他状态
        setSelectedCategory(null)
        setIsRandomMode(false)
        setIsTestComplete(false)
      } else {
        console.log("没有错误单词需要重新测试")
      }
    },
    [incorrectWords],
  )

  // 切换调试模式
  const toggleDebugMode = () => {
    setDebugMode((prev) => !prev)
  }

  return (
    <div className="gradient-bg w-full min-h-screen p-16 flex flex-col">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={() =>
              selectedCategory || isRandomMode || isRetestMode ? handleBackToCategories() : router.push("/")
            }
            className="rounded-full p-2 text-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-3xl font-bold ml-4 text-black">
            {isRetestMode
              ? "错误单词复习"
              : isRandomMode
                ? "随机单词学习"
                : selectedCategory
                  ? `${selectedCategory} 级单词`
                  : "选择学习内容"}
          </h2>
        </div>

        <div className="flex items-center">
          <button onClick={toggleDebugMode} className="mr-4 text-xs text-gray-500">
            {debugMode ? "关闭调试" : "调试"}
          </button>
          <button onClick={() => setShowSettings(true)} className="rounded-full p-2 text-black">
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
          </button>
        </div>
      </header>

      {showSettings && (
        <Settings initialSettings={settings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} />
      )}

      <div className="flex-1 flex flex-col">
        {!selectedCategory && !isRandomMode && !isRetestMode && (
          <CategorySelector onSelectCategory={handleSelectCategory} onSelectRandom={handleSelectRandom} />
        )}

        {/* 显示选定类别的单词数量和开始学习按钮 */}
        {(selectedCategory || isRandomMode) && words.length === 0 && !isTestComplete && !isRetestMode && (
          <div className="flex-1 flex flex-col items-center justify-center">
            {isLoading && <div className="text-3xl text-black mb-8">加载中...</div>}
            {!isLoading && (
              <>
                {selectedCategory && categoryWordCount !== null && (
                  <div className="text-3xl text-black mb-8">
                    {categoryWordCount > 0
                      ? `${selectedCategory} 级共有 ${categoryWordCount} 个单词`
                      : `${selectedCategory} 级暂无单词`}
                  </div>
                )}

                {isRandomMode && <div className="text-3xl text-black mb-8">随机学习模式</div>}

                {((selectedCategory && categoryWordCount && categoryWordCount > 0) || isRandomMode) && (
                  <button
                    onClick={handleStartLearning}
                    className="bg-black text-white text-2xl py-6 px-12 rounded-full shadow-lg flex items-center"
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
                  </button>
                )}

                {selectedCategory && categoryWordCount === 0 && (
                  <button onClick={handleBackToCategories} className="bg-black text-white text-xl py-4 px-8 rounded-xl">
                    返回选择
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {words.length > 0 && !isTestComplete && (
          <WordTest
            words={words}
            onComplete={handleTestComplete}
            timeLimit={settings.timeLimit}
            onRetestIncorrect={handleRetestIncorrect}
          />
        )}

        {isTestComplete && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="bg-white rounded-3xl shadow-lg p-12 mb-8 text-center">
              <h2 className="text-4xl font-bold text-black mb-6">恭喜完成学习！</h2>
              <p className="text-2xl text-black mb-8">你已经完成了 {words.length} 个单词的学习</p>

              <div className="flex space-x-6">
                <button onClick={handleRestartTest} className="bg-black text-white text-xl py-4 px-8 rounded-xl">
                  再次学习
                </button>
                <button
                  onClick={handleBackToCategories}
                  className="border-2 border-black text-black text-xl py-4 px-8 rounded-xl"
                >
                  选择其他内容
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 调试信息 */}
      {debugMode && (
        <div className="fixed bottom-0 left-0 bg-black bg-opacity-70 text-white p-2 text-xs z-50">
          <div>模式: {isRetestMode ? "重新测试" : isRandomMode ? "随机" : selectedCategory ? "分类" : "选择"}</div>
          <div>单词数: {words.length}</div>
          <div>错误单词数: {incorrectWords.length}</div>
          <div>重新测试模式: {isRetestMode ? "是" : "否"}</div>
          <div>测试完成: {isTestComplete ? "是" : "否"}</div>
          <div>加载中: {isLoading ? "是" : "否"}</div>
          <div>选定类别单词总数: {categoryWordCount !== null ? categoryWordCount : "未加载"}</div>
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() =>
                console.log({
                  isRetestMode,
                  isRandomMode,
                  selectedCategory,
                  words,
                  incorrectWords,
                  isTestComplete,
                  isLoading,
                  categoryWordCount,
                })
              }
              className="bg-red-500 px-2 py-1 rounded text-xs"
            >
              打印状态
            </button>
            <button onClick={() => handleRetestIncorrect()} className="bg-green-500 px-2 py-1 rounded text-xs">
              强制重新测试
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
