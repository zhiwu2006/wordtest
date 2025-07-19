"use client"

import { useState, useEffect, useRef } from "react"
import { type DictionaryWord, updateWordProgress } from "@/lib/supabase"
import WordStats from "./word-stats"

interface WordTestProps {
  words: DictionaryWord[]
  onComplete: () => void
  timeLimit?: number // 单位：秒
  onRetestIncorrect?: (incorrectWords: DictionaryWord[]) => void
}

// 将级别代码转换为显示文本
const getLevelDisplay = (level: string): string => {
  return `${level} 级`
}

export default function WordTest({ words, onComplete, timeLimit = 2, onRetestIncorrect }: WordTestProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const [progress, setProgress] = useState(0)
  const [reviewList, setReviewList] = useState<number[]>([])
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // 添加计分状态
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)

  // 添加答题记录
  const [correctWords, setCorrectWords] = useState<DictionaryWord[]>([])
  const [incorrectWords, setIncorrectWords] = useState<DictionaryWord[]>([])

  // 添加详细统计显示状态
  const [showStats, setShowStats] = useState(false)

  // 在 state 部分添加一个新的状态来跟踪已正确回答的单词ID
  const [correctWordIds, setCorrectWordIds] = useState<Set<number>>(new Set())

  // 添加一个状态来跟踪已经测试过的单词数量
  const [testedWordsCount, setTestedWordsCount] = useState(0)

  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentWord = words[currentWordIndex]
  const totalAnswered = correctCount + incorrectCount

  // 暂停所有计时器
  const pauseAllTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    // 取消所有正在进行的朗读
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }
  }

  // 恢复计时器
  const resumeTimers = () => {
    if (!timerRef.current && !showCorrectAnswer && currentWord) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  // 朗读单词
  const speakWord = (word: string) => {
    // 检查浏览器是否支持语音合成
    if (!("speechSynthesis" in window)) {
      console.warn("This browser does not support speech synthesis")
      return
    }

    try {
      // 取消任何正在进行的朗读
      window.speechSynthesis.cancel()

      // 创建一个新的语音实例
      const utterance = new SpeechSynthesisUtterance(word)

      // 设置语音属性
      utterance.lang = "en-US" // 设置语言为英语
      utterance.rate = 0.8 // 设置语速稍慢一些，更适合学习
      utterance.pitch = 1 // 设置音调
      utterance.volume = 1 // 确保音量最大

      // 开始朗读前设置状态
      setIsSpeaking(true)

      // 朗读结束后的回调
      utterance.onend = () => {
        setIsSpeaking(false)
      }

      // 朗读错误的回调
      utterance.onerror = (event) => {
        console.warn("Speech synthesis error:", event)
        setIsSpeaking(false)
      }

      // 开始朗读
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("Speech synthesis failed:", error)
      setIsSpeaking(false)
    }
  }

  // 手动朗读单词
  const handleSpeakClick = () => {
    if (!isSpeaking && currentWord) {
      speakWord(currentWord.word)
    }
  }

  // 检查是否应该结束测试
  const checkShouldEndTest = () => {
    // 如果已测试的单词数量达到了总单词数量，结束测试
    if (testedWordsCount >= words.length) {
      console.log("已测试所有单词，测试完成")
      onComplete()
      return true
    }
    return false
  }

  // 生成选项
  useEffect(() => {
    if (!currentWord) return

    // 当前单词的正确答案
    const correctAnswer = currentWord.translation

    // 从其他单词中随机选择3个不同的错误答案
    const incorrectOptions = words
      .filter((word) => word.id !== currentWord.id && word.translation !== correctAnswer)
      .map((word) => word.translation)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)

    // 合并正确答案和错误答案，并随机排序
    const allOptions = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

    setOptions(allOptions)
    setSelectedOption(null)
    setIsCorrect(null)
    setTimeLeft(timeLimit)
    setShowCorrectAnswer(false)
    startTimeRef.current = Date.now()

    // 清除之前的计时器
    pauseAllTimers()

    // 如果不在统计视图中，设置计时器
    if (!showStats) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // 时间到，显示正确答案
            handleTimeout()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    // 更新进度
    setProgress(((currentWordIndex + 1) / words.length) * 100)

    // 自动朗读当前单词
    if (currentWord.word && !showStats) {
      // 短暂延迟后朗读，确保UI已更新
      const speakTimeout = setTimeout(() => {
        try {
          speakWord(currentWord.word)
        } catch (error) {
          console.error("Auto-speak failed:", error)
        }
      }, 500)

      return () => {
        clearTimeout(speakTimeout)
        pauseAllTimers()
      }
    }

    return () => {
      pauseAllTimers()
    }
  }, [currentWordIndex, words, timeLimit, showStats])

  // 当统计视图状态改变时，暂停或恢复计时器
  useEffect(() => {
    if (showStats) {
      pauseAllTimers()
    } else {
      resumeTimers()
    }
  }, [showStats])

  // 处理超时
  const handleTimeout = () => {
    pauseAllTimers()

    // 将当前单词添加到复习列表
    if (!reviewList.includes(currentWordIndex)) {
      setReviewList((prev) => [...prev, currentWordIndex])
    }

    // 显示正确答案
    setShowCorrectAnswer(true)

    // 更新错误计数和记录
    setIncorrectCount((prev) => prev + 1)
    setIncorrectWords((prev) => [...prev, currentWord])

    // 增加已测试单词计数
    setTestedWordsCount((prev) => prev + 1)

    // 1秒后移动到下一个单词
    timeoutRef.current = setTimeout(() => {
      moveToNextWord()
    }, 1000)
  }

  // 处理选项选择
  const handleOptionSelect = async (option: string) => {
    if (selectedOption !== null || !currentWord || showCorrectAnswer) return

    const isAnswerCorrect = option === currentWord.translation
    setSelectedOption(option)
    setIsCorrect(isAnswerCorrect)

    // 更新计分和记录
    if (isAnswerCorrect) {
      setCorrectCount((prev) => prev + 1)
      setCorrectWords((prev) => [...prev, currentWord])
      // 添加到已正确回答的单词ID集合中
      setCorrectWordIds((prev) => new Set([...prev, currentWord.id]))
    } else {
      setIncorrectCount((prev) => prev + 1)
      setIncorrectWords((prev) => [...prev, currentWord])
      // 显示正确答案
      setShowCorrectAnswer(true)
    }

    // 增加已测试单词计数
    setTestedWordsCount((prev) => prev + 1)

    // 计算响应时间（毫秒）
    const responseTime = Date.now() - startTimeRef.current

    // 更新单词进度到数据库
    await updateWordProgress(currentWord.id, isAnswerCorrect, responseTime)

    // 如果回答错误，添加到复习列表
    if (!isAnswerCorrect && !reviewList.includes(currentWordIndex)) {
      setReviewList((prev) => [...prev, currentWordIndex])
    }

    // 暂停计时器
    pauseAllTimers()

    // 延迟移动到下一个单词
    timeoutRef.current = setTimeout(() => {
      moveToNextWord()
    }, 1500)
  }

  // 移动到下一个单词
  const moveToNextWord = () => {
    // 首先检查是否应该结束测试
    if (testedWordsCount >= words.length) {
      console.log("已测试所有单词，测试完成")
      onComplete()
      return
    }

    // 如果当前是最后一个单词
    if (currentWordIndex === words.length - 1) {
      // 如果还有需要复习的单词
      if (reviewList.length > 0) {
        // 移动到第一个需要复习的单词
        setCurrentWordIndex(reviewList[0])
        // 从复习列表中移除该单词
        setReviewList((prev) => prev.slice(1))
      } else {
        // 如果没有需要复习的单词，但仍有未正确回答的单词
        // 找出所有未正确回答的单词的索引
        const incorrectIndices = words
          .map((word, index) => (!correctWordIds.has(word.id) ? index : -1))
          .filter((index) => index !== -1)

        if (incorrectIndices.length > 0) {
          // 将未正确回答的单词添加到复习列表
          setReviewList(incorrectIndices)
          // 移动到第一个未正确回答的单词
          setCurrentWordIndex(incorrectIndices[0])
          // 从复习列表中移除该单词
          setReviewList((prev) => prev.slice(1))
        } else {
          // 所有单词都已正确回答
          onComplete()
        }
      }
    } else {
      // 移动到下一个单词
      setCurrentWordIndex((prev) => prev + 1)
    }
  }

  // 计算圆环进度
  const calculateCircleProgress = () => {
    const circumference = 2 * Math.PI * 45
    const offset = circumference - (timeLeft / timeLimit) * circumference
    return offset
  }

  // 打开统计视图
  const openStats = () => {
    pauseAllTimers()
    setShowStats(true)
  }

  // 关闭统计视图
  const closeStats = () => {
    setShowStats(false)
    resumeTimers()
  }

  // 重新测试错误的单词
  const handleRetestIncorrect = () => {
    // 确保有错误单词
    if (incorrectWords.length === 0) {
      console.log("没有错误单词需要重新测试")
      return
    }

    console.log("准备重新测试错误单词:", incorrectWords.length)

    // 如果提供了回调函数，则调用它
    if (onRetestIncorrect) {
      // 直接调用回调函数，让父组件处理错误单词
      onRetestIncorrect(incorrectWords)
    }
  }

  // 组件挂载时初始化语音合成
  useEffect(() => {
    // 预热语音合成引擎
    if ("speechSynthesis" in window) {
      try {
        // 确保语音合成服务已准备好
        if (window.speechSynthesis.getVoices().length === 0) {
          // 在某些浏览器中，需要等待voices加载
          window.speechSynthesis.addEventListener(
            "voiceschanged",
            () => {
              console.log("Speech synthesis voices loaded")
            },
            { once: true },
          )
        }

        // 确保页面卸载时取消所有语音
        return () => {
          window.speechSynthesis.cancel()
        }
      } catch (error) {
        console.error("Speech synthesis initialization failed:", error)
      }
    }
  }, [])

  if (!currentWord) {
    return <div className="text-3xl text-black">加载中...</div>
  }

  // 如果显示统计视图，渲染统计组件
  if (showStats) {
    return (
      <WordStats
        mode="test"
        correctWords={correctWords}
        incorrectWords={incorrectWords}
        onBack={closeStats}
        onRetestIncorrect={handleRetestIncorrect}
      />
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative">
      {/* 计分板 */}
      <div
        className="absolute top-0 right-0 bg-white rounded-xl shadow-md p-4 flex items-center space-x-6 cursor-pointer hover:shadow-lg transition-all duration-300"
        onClick={openStats}
      >
        <div className="flex flex-col items-center">
          <span className="text-green-600 text-2xl font-bold">{correctCount}</span>
          <span className="text-sm text-black">正确</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-red-600 text-2xl font-bold">{incorrectCount}</span>
          <span className="text-sm text-black">错误</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-black text-2xl font-bold">{words.length}</span>
          <span className="text-sm text-black">总数</span>
        </div>
      </div>

      {/* 计时器圆环 */}
      <div className="relative mb-8">
        <svg className="w-32 h-32" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#000"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={calculateCircleProgress()}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-black">{timeLeft}s</span>
        </div>
      </div>

      {/* 单词展示 */}
      <div className="bg-white rounded-3xl shadow-lg p-12 mb-16 w-2/3 text-center relative">
        <h1 className="text-7xl font-bold text-black mb-4">{currentWord.word}</h1>
        <p className="text-2xl text-black">难度: {getLevelDisplay(currentWord.level)}</p>

        {/* 朗读按钮 */}
        <button
          onClick={handleSpeakClick}
          disabled={isSpeaking}
          className="absolute top-4 right-4 p-3 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="朗读单词"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-black"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
          </svg>
        </button>
      </div>

      {/* 选项 */}
      <div className="grid grid-cols-2 gap-8 w-3/4">
        {options.map((option, index) => {
          const isCorrectAnswer = option === currentWord.translation
          const isSelected = selectedOption === option

          let optionStyle = "bg-white"

          // 如果选择了这个选项
          if (isSelected) {
            // 如果答对了，显示绿色
            if (isCorrect) {
              optionStyle = "bg-green-100 ring-4 ring-green-500"
            }
            // 如果答错了，显示红色
            else {
              optionStyle = "bg-red-100 ring-4 ring-red-500"
            }
          }
          // 如果需要显示正确答案（时间到或答错了）
          else if (showCorrectAnswer && isCorrectAnswer) {
            optionStyle = "bg-green-100 ring-4 ring-green-500"
          }

          return (
            <div
              key={index}
              onClick={() => handleOptionSelect(option)}
              className={`option-card ${optionStyle} rounded-2xl shadow-md p-8 text-center cursor-pointer hover:shadow-lg transition-all duration-300`}
            >
              <h3 className="text-3xl text-black">{option}</h3>
            </div>
          )
        })}
      </div>

      {/* 进度指示器 */}
      <div className="mt-12 w-full">
        <div className="flex justify-between mb-2">
          <span className="text-black">进度</span>
          <span className="text-black">
            {testedWordsCount}/{words.length}
            {reviewList.length > 0 && ` (需复习: ${reviewList.length})`}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-black rounded-full h-3 transition-all duration-300 ease-out"
            style={{ width: `${(testedWordsCount / words.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}
