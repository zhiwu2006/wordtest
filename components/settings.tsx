"use client"

import type React from "react"

import { useState } from "react"

interface SettingsProps {
  initialSettings: {
    timeLimit: number
    wordCount: number
  }
  onSave: (settings: { timeLimit: number; wordCount: number }) => void
  onClose: () => void
}

export default function Settings({ initialSettings, onSave, onClose }: SettingsProps) {
  const [timeLimit, setTimeLimit] = useState(initialSettings.timeLimit)
  const [wordCount, setWordCount] = useState(initialSettings.wordCount)
  const [errors, setErrors] = useState({ timeLimit: "", wordCount: "" })

  const validateSettings = () => {
    const newErrors = { timeLimit: "", wordCount: "" }
    let isValid = true

    // 验证时间限制
    if (timeLimit <= 0) {
      newErrors.timeLimit = "时间必须大于0秒"
      isValid = false
    }

    // 验证单词数量
    if (wordCount <= 0) {
      newErrors.wordCount = "单词数量必须大于0"
      isValid = false
    } else if (wordCount > 1000) {
      newErrors.wordCount = "单词数量不能超过1000"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateSettings()) {
      onSave({
        timeLimit: Number(timeLimit),
        wordCount: Number(wordCount),
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-black">设置</h2>
          <button onClick={onClose} className="text-black">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="time-limit" className="block text-xl mb-2 text-black">
              单词解答时间（秒）
            </label>
            <input
              id="time-limit"
              type="number"
              step="any"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className={`w-full p-4 text-xl border-2 ${errors.timeLimit ? "border-red-500" : "border-black"} rounded-xl text-black`}
            />
            {errors.timeLimit && <p className="mt-1 text-red-500">{errors.timeLimit}</p>}
            <p className="mt-1 text-sm text-black text-opacity-70">可以设置任意时长，包括小数（如 1.5 秒）</p>
          </div>

          <div className="mb-8">
            <label htmlFor="word-count" className="block text-xl mb-2 text-black">
              每次练习单词数量（最多1000个）
            </label>
            <input
              id="word-count"
              type="number"
              min="1"
              max="1000"
              value={wordCount}
              onChange={(e) => setWordCount(Number(e.target.value))}
              className={`w-full p-4 text-xl border-2 ${errors.wordCount ? "border-red-500" : "border-black"} rounded-xl text-black`}
            />
            {errors.wordCount && <p className="mt-1 text-red-500">{errors.wordCount}</p>}
          </div>

          <div className="flex space-x-4">
            <button type="submit" className="flex-1 bg-black text-white text-xl py-4 rounded-xl shadow-md">
              保存设置
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-black text-black text-xl py-4 rounded-xl"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
