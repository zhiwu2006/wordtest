"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import ImportWords from "@/components/import-words"

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    timeLimit: 10,
    wordCount: 20,
  })

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    // 保存设置到本地存储
    localStorage.setItem("wordAppSettings", JSON.stringify(settings))
    router.push("/")
  }

  return (
    <div className="gradient-bg w-full min-h-screen p-16 flex flex-col">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center">
          <button onClick={() => router.push("/")} className="rounded-full p-2 text-black">
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
          <h2 className="text-3xl font-bold ml-4 text-black">设置</h2>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center">
        <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-2xl mb-12">
          <h3 className="text-2xl font-bold mb-6 text-black">学习设置</h3>

          <form onSubmit={handleSaveSettings}>
            <div className="mb-6">
              <label htmlFor="time-limit" className="block text-xl mb-2 text-black">
                单词解答时间（秒）
              </label>
              <input
                id="time-limit"
                type="number"
                min="3"
                max="30"
                value={settings.timeLimit}
                onChange={(e) => setSettings({ ...settings, timeLimit: Number(e.target.value) })}
                className="w-full p-4 text-xl border-2 border-black rounded-xl text-black"
              />
            </div>

            <div className="mb-8">
              <label htmlFor="word-count" className="block text-xl mb-2 text-black">
                每次练习单词数量
              </label>
              <input
                id="word-count"
                type="number"
                min="5"
                max="100"
                value={settings.wordCount}
                onChange={(e) => setSettings({ ...settings, wordCount: Number(e.target.value) })}
                className="w-full p-4 text-xl border-2 border-black rounded-xl text-black"
              />
            </div>

            <button type="submit" className="w-full bg-black text-white text-2xl py-4 rounded-xl shadow-md">
              保存设置
            </button>
          </form>
        </div>

        <ImportWords />
      </div>
    </div>
  )
}
