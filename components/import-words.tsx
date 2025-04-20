"use client"

import type React from "react"

import { useState } from "react"
import { importWords } from "@/lib/supabase"

export default function ImportWords() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const [totalWords, setTotalWords] = useState(0)
  const [importedWords, setImportedWords] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [logMessages, setLogMessages] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogMessages((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      // 重置状态
      setMessage("")
      setError("")
      setProgress(0)
      setTotalWords(0)
      setImportedWords(0)
      setLogMessages([])
    }
  }

  const validateWords = (words: any[]): { valid: boolean; message?: string; validWords: any[] } => {
    if (!Array.isArray(words)) {
      return { valid: false, message: "文件格式不正确，请确保是包含单词数组的JSON文件", validWords: [] }
    }

    const validWords = []
    const invalidWords = []

    for (const word of words) {
      if (!word.word || !word.translation || !word.level) {
        invalidWords.push(word)
      } else {
        // 确保level是字符串类型
        validWords.push({
          word: word.word,
          translation: word.translation,
          level: String(word.level),
        })
      }
    }

    if (invalidWords.length > 0) {
      return {
        valid: validWords.length > 0,
        message: `发现 ${invalidWords.length} 个格式不正确的单词，已跳过`,
        validWords,
      }
    }

    return { valid: true, validWords }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError("请选择文件")
      return
    }

    setIsLoading(true)
    setError("")
    setMessage("")
    setProgress(0)
    setTotalWords(0)
    setImportedWords(0)
    setLogMessages([])

    try {
      // 读取JSON文件
      addLog("开始读取文件...")
      const fileContent = await file.text()
      let words

      try {
        words = JSON.parse(fileContent)
        addLog(`文件解析成功，检测到 ${Array.isArray(words) ? words.length : 0} 个条目`)
      } catch (parseError) {
        throw new Error("JSON解析失败，请确保文件格式正确")
      }

      // 验证数据格式
      addLog("验证数据格式...")
      const validation = validateWords(words)

      if (!validation.valid || validation.validWords.length === 0) {
        throw new Error(validation.message || "没有有效的单词数据")
      }

      if (validation.message) {
        addLog(validation.message)
      }

      const validWords = validation.validWords
      setTotalWords(validWords.length)
      addLog(`验证通过，准备导入 ${validWords.length} 个单词`)

      // 导入单词
      addLog("开始导入单词...")
      setProgress(10) // 设置初始进度

      await importWords(validWords)

      setProgress(100)
      setImportedWords(validWords.length)
      setMessage(`成功导入 ${validWords.length} 个单词`)
      addLog(`导入完成，成功导入 ${validWords.length} 个单词`)

      // 重置文件输入
      const fileInput = document.getElementById("file-input") as HTMLInputElement
      if (fileInput) fileInput.value = ""
      setFile(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "导入失败，请检查文件格式"
      setError(errorMessage)
      addLog(`导入失败: ${errorMessage}`)
      setProgress(0)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-2xl">
      <h2 className="text-3xl font-bold mb-6 text-black">导入单词</h2>

      {message && (
        <div className="mb-6 p-4 bg-green-100 rounded-xl text-black">
          <p className="font-bold text-green-700">{message}</p>
          {importedWords > 0 && <p className="text-sm text-green-700">成功导入 {importedWords} 个单词</p>}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 rounded-xl text-black">
          <p className="font-bold text-red-700">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-black">导入进度</span>
            <span className="text-sm text-black">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-black h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {totalWords > 0 && (
            <p className="text-sm text-center mt-2 text-black">
              {importedWords > 0 ? `已导入 ${importedWords} / ${totalWords} 个单词` : `准备导入 ${totalWords} 个单词`}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <label htmlFor="file-input" className="block text-xl mb-2 text-black">
            JSON文件
          </label>
          <input
            id="file-input"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full p-4 text-xl border-2 border-black rounded-xl text-black"
            required
          />
          <p className="mt-2 text-black text-opacity-70">
            文件格式：JSON数组，每个单词包含word（英文）、translation（中文）和level（难度级别）字段
          </p>
          <p className="mt-2 text-black text-opacity-70">示例：</p>
          <pre className="mt-2 p-4 bg-gray-100 rounded-xl text-sm overflow-auto">
            {`[
  {
    "word": "apple",
    "translation": "苹果",
    "level": "E"
  },
  {
    "word": "banana",
    "translation": "香蕉",
    "level": "E"
  }
]`}
          </pre>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white text-2xl py-4 rounded-xl shadow-md disabled:opacity-50"
        >
          {isLoading ? "导入中..." : "导入单词"}
        </button>
      </form>

      {/* 导入日志 */}
      {logMessages.length > 0 && (
        <div className="mt-6">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setShowDetails(!showDetails)}
          >
            <h3 className="text-lg font-medium text-black">导入日志</h3>
            <button className="text-black">{showDetails ? "隐藏" : "显示"}</button>
          </div>

          {showDetails && (
            <div className="mt-2 p-4 bg-gray-100 rounded-xl text-sm text-black max-h-60 overflow-y-auto">
              {logMessages.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
