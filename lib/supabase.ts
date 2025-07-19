import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 检查环境变量是否存在
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anonymous Key is missing. Please check your environment variables.")
}

console.log("Supabase URL:", supabaseUrl ? "已设置" : "未设置")
console.log("Supabase Anon Key:", supabaseAnonKey ? "已设置" : "未设置")

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// 添加重试功能的通用函数
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000,
  backoff = 2,
  onError?: (error: any, attempt: number) => void,
): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (onError) {
        onError(error, attempt + 1)
      } else {
        console.warn(`操作失败，第 ${attempt + 1} 次尝试，${delay}ms 后重试...`, error)
      }

      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= backoff
      }
    }
  }

  throw lastError
}

// 匹配您的数据库表结构
export type DictionaryWord = {
  id: number
  word: string // 英文单词
  translation: string // 中文翻译
  level: string // 难度级别
}

// 难度级别及其单词数量
export type LevelCount = {
  level: string
  count: number
}

// 全局变量，用于跟踪是否使用模拟数据
export let isUsingMockData = false

// 获取所有难度级别及其单词数量 - 优化版本，直接从数据库查询统计信息
export async function getLevelsWithCount(): Promise<LevelCount[]> {
  try {
    console.log("开始获取难度级别及单词数量")

    // 重置模拟数据标志
    isUsingMockData = false

    // 检查环境变量是否存在
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("环境变量缺失，无法连接到 Supabase")
      isUsingMockData = true
      return getMockLevelCounts()
    }

    // 首先检查 Supabase 连接是否可用
    try {
      console.log("尝试连接 Supabase...")
      const { data: healthData, error: healthError } = await supabase.from("dictionary").select("id").limit(1)

      if (healthError) {
        console.error("Supabase 连接检查失败:", healthError)
        isUsingMockData = true
        return getMockLevelCounts()
      }

      console.log("Supabase 连接成功")
    } catch (connectionError) {
      console.error("Supabase 连接异常:", connectionError)
      isUsingMockData = true
      return getMockLevelCounts()
    }

    // 方法1: 使用RPC函数获取级别统计
    console.log("方法1: 尝试使用RPC函数获取级别统计...")
    try {
      const { data, error } = await supabase.rpc("count_words_by_level")

      if (!error && data && data.length > 0) {
        console.log("RPC函数成功获取级别统计:", data)
        return data
      }

      console.log("RPC函数未返回数据或发生错误:", error)
    } catch (rpcError) {
      console.error("RPC函数异常:", rpcError)
    }

    // 方法2: 使用原生SQL查询获取级别统计
    console.log("方法2: 尝试使用原生SQL查询获取级别统计...")
    try {
      const { data, error } = await supabase.rpc("get_level_counts_sql")

      if (!error && data && data.length > 0) {
        console.log("SQL查询成功获取级别统计:", data)
        return data
      }

      console.log("SQL查询未返回数据或发生错误:", error)
    } catch (sqlError) {
      console.error("SQL查询异常:", sqlError)
    }

    // 方法3: 分页获取所有记录并在客户端手动统计
    console.log("方法3: 尝试分页获取所有记录并在客户端手动统计...")
    try {
      const PAGE_SIZE = 1000
      const allRecords: { level: string }[] = []
      let page = 0
      let hasMore = true

      console.log("开始分页获取...")
      while (hasMore) {
        const from = page * PAGE_SIZE
        const to = from + PAGE_SIZE - 1
        console.log(`正在获取第 ${page + 1} 页 (记录 ${from} 到 ${to})...`)

        const { data, error } = await supabase
          .from("dictionary")
          .select("level")
          .not("level", "is", null) // 忽略 level 为 null 的记录
          .range(from, to)

        if (error) {
          console.error(`获取第 ${page + 1} 页时出错:`, error)
          throw error // 抛出错误以中止
        }

        if (data) {
          allRecords.push(...data)
        }

        if (!data || data.length < PAGE_SIZE) {
          hasMore = false
        } else {
          page++
        }
      }

      console.log(`分页获取完成，共获取到 ${allRecords.length} 条记录。`)

      if (allRecords.length > 0) {
        // 手动计算每个级别的单词数量
        const levelCounts: Record<string, number> = {}
        allRecords.forEach((item) => {
          if (item.level) {
            const level = item.level.trim().toUpperCase()
            levelCounts[level] = (levelCounts[level] || 0) + 1
          }
        })

        console.log("客户端手动统计结果:", levelCounts)

        // 转换为数组格式
        const result = Object.entries(levelCounts).map(([level, count]) => ({
          level,
          count,
        }))

        console.log("返回最终统计结果:", result)
        return result
      }
    } catch (fallbackError) {
      console.error("客户端手动统计失败:", fallbackError)
    }

    // 如果所有方法都失败，抛出错误，然后由最外层的 catch 处理
    throw new Error("所有获取单词统计的方法都失败了。")
  } catch (error) {
    console.error("获取难度级别失败:", error)
    isUsingMockData = true
    return getMockLevelCounts()
  }
}

// 获取所有难度级别
export async function getLevels(): Promise<string[]> {
  try {
    // 检查环境变量是否存在
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("环境变量缺失，无法连接到 Supabase")
      isUsingMockData = true
      return getMockLevels()
    }

    // 尝试使用SQL查询获取唯一级别
    try {
      const { data: levelData, error: levelError } = await supabase.rpc("get_unique_levels")

      if (!levelError && levelData && levelData.length > 0) {
        console.log("SQL查询成功获取唯一级别:", levelData)
        return levelData.map((item) => item.level)
      }
    } catch (sqlError) {
      console.error("SQL查询获取唯一级别失败:", sqlError)
    }

    // 备用方法：直接查询并在客户端去重
    const { data, error } = await withRetry(
      () => supabase.from("dictionary").select("level").not("level", "is", null),
      3,
    )

    if (error) {
      console.error("Error fetching levels:", error)
      isUsingMockData = true
      return getMockLevels()
    }

    // 提取唯一的难度级别
    const levels = [...new Set(data.map((item) => item.level?.trim().toUpperCase() || "").filter(Boolean))]
    console.log("获取到的唯一级别:", levels)
    return levels
  } catch (error) {
    console.error("获取难度级别失败:", error)
    isUsingMockData = true
    return getMockLevels()
  }
}

// 获取特定难度级别的单词 - 按需加载
export async function getWordsByCategory(level: string, limit = 100000): Promise<DictionaryWord[]> {
  try {
    // 检查环境变量是否存在
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("环境变量缺失，无法连接到 Supabase")
      isUsingMockData = true
      return getMockWordsByLevel(level, limit)
    }

    console.log(`尝试获取级别为 "${level}" 的单词...`)

    // 使用精确匹配
    const { data, error } = await withRetry(
      () => supabase.from("dictionary").select("*").eq("level", level).limit(limit),
      3,
    )

    if (error) {
      console.error(`获取 ${level} 级单词失败:`, error)

      // 尝试使用模糊匹配作为备用方案
      console.log(`尝试使用模糊匹配获取 ${level} 级单词...`)
      const { data: fuzzyData, error: fuzzyError } = await supabase
        .from("dictionary")
        .select("*")
        .ilike("level", `%${level}%`)
        .limit(limit)

      if (fuzzyError || !fuzzyData || fuzzyData.length === 0) {
        console.error("模糊匹配也失败了:", fuzzyError)
        isUsingMockData = true
        return getMockWordsByLevel(level, limit)
      }

      console.log(`模糊匹配成功，获取到 ${fuzzyData.length} 个单词`)
      return fuzzyData
    }

    console.log(`获取到 ${data?.length || 0} 个级别为 "${level}" 的单词`)

    return data || []
  } catch (error) {
    console.error("获取单词失败:", error)
    isUsingMockData = true
    return getMockWordsByLevel(level, limit)
  }
}

// 获取随机单词
export async function getRandomWords(limit = 100): Promise<DictionaryWord[]> {
  try {
    // 检查环境变量是否存在
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("环境变量缺失，无法连接到 Supabase")
      isUsingMockData = true
      return getMockRandomWords(limit)
    }

    // 尝试使用SQL函数获取随机单词
    try {
      const { data: randomData, error: randomError } = await supabase.rpc("get_random_words_sql", {
        limit_count: limit,
      })

      if (!randomError && randomData && randomData.length > 0) {
        console.log(`SQL查询成功获取 ${randomData.length} 个随机单词`)
        return randomData
      }
    } catch (sqlError) {
      console.error("SQL查询获取随机单词失败:", sqlError)
    }

    // 备用方法：使用原生查询并随机排序
    console.log(`尝试获取 ${limit} 个随机单词...`)
    const { data, error } = await withRetry(
      () => supabase.from("dictionary").select("*").order("id", { ascending: false }).limit(limit),
      3,
    )

    if (error || !data) {
      console.error("Error fetching random words:", error)
      isUsingMockData = true
      return getMockRandomWords(limit)
    }

    // 客户端随机排序
    const shuffled = [...data].sort(() => Math.random() - 0.5)
    console.log(`获取到 ${shuffled.length} 个随机单词`)
    return shuffled
  } catch (error) {
    console.error("获取随机单词失败:", error)
    isUsingMockData = true
    return getMockRandomWords(limit)
  }
}

// 更新单词学习记录（如果需要跟踪学习进度）
export async function updateWordProgress(wordId: number, isCorrect: boolean, responseTime?: number): Promise<void> {
  try {
    // 如果需要跟踪进度，可以添加相关字段到数据库
    console.log(`Word ${wordId} answered ${isCorrect ? "correctly" : "incorrectly"} in ${responseTime}ms`)
  } catch (error) {
    console.error("更新单词进度失败:", error)
  }
}

// 导入单词到数据库
export async function importWords(words: Omit<DictionaryWord, "id">[]): Promise<void> {
  try {
    // 检查环境变量是否存在
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("环境变量缺失，无法连接到 Supabase")
      throw new Error("无法连接到数据库，请检查环境变量")
    }

    console.log(`准备导入 ${words.length} 个单词...`)

    // 尝试使用SQL函数批量导入
    try {
      console.log("尝试使用SQL函数批量导入...")
      const { data: importData, error: importError } = await supabase.rpc("import_words", { words: words })

      if (!importError && importData) {
        console.log(`SQL函数成功导入 ${importData} 个单词`)
        return
      }

      console.log("SQL函数导入失败或未返回数据:", importError)
    } catch (sqlError) {
      console.error("SQL函数导入异常:", sqlError)
    }

    // 如果单词数量过多，分批导入
    const BATCH_SIZE = 100 // Supabase 推荐的批量大小

    if (words.length <= BATCH_SIZE) {
      // 单批次导入
      console.log(`单批次导入 ${words.length} 个单词...`)
      const { error, data } = await withRetry(
        () => supabase.from("dictionary").insert(words).select(),
        3,
        2000, // 增加重试延迟
        2,
        (error, attempt) => {
          console.warn(`导入单词失败，第 ${attempt} 次尝试`, error)
        },
      )

      if (error) {
        console.error("导入单词失败:", error)
        throw new Error("导入单词失败: " + error.message)
      }

      console.log(`成功导入 ${data?.length || 0} 个单词`)
    } else {
      // 分批导入
      console.log(`分批导入 ${words.length} 个单词，每批 ${BATCH_SIZE} 个...`)

      let successCount = 0
      let failedBatches = 0

      // 将单词分成多个批次
      for (let i = 0; i < words.length; i += BATCH_SIZE) {
        const batch = words.slice(i, i + BATCH_SIZE)
        console.log(`导入第 ${Math.floor(i / BATCH_SIZE) + 1} 批，包含 ${batch.length} 个单词...`)

        try {
          const { error, data } = await withRetry(() => supabase.from("dictionary").insert(batch).select(), 3, 2000, 2)

          if (error) {
            console.error(`第 ${Math.floor(i / BATCH_SIZE) + 1} 批导入失败:`, error)
            failedBatches++
          } else {
            successCount += data?.length || 0
            console.log(`第 ${Math.floor(i / BATCH_SIZE) + 1} 批导入成功，已导入 ${successCount} 个单词`)
          }

          // 批次之间添加延迟，避免触发限流
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (batchError) {
          console.error(`第 ${Math.floor(i / BATCH_SIZE) + 1} 批导入异常:`, batchError)
          failedBatches++
        }
      }

      console.log(`导入完成，成功导入 ${successCount} 个单词，失败批次 ${failedBatches} 个`)

      if (failedBatches > 0) {
        throw new Error(`部分数据导入失败，共 ${failedBatches} 个批次失败，请重试`)
      }
    }
  } catch (error) {
    console.error("导入单词失败:", error)
    throw new Error(error instanceof Error ? error.message : "导入单词失败，请检查网络连接或数据格式")
  }
}

// 获取所有分类
export async function getCategories(): Promise<string[]> {
  return getLevels() // 复用获取级别的函数
}

// 获取特定级别的单词数量
export async function getWordCountByLevel(level: string): Promise<number> {
  try {
    // 检查环境变量是否存在
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("环境变量缺失，无法连接到 Supabase")
      isUsingMockData = true
      return 0
    }

    const normalizedLevel = level.trim().toUpperCase()
    console.log(`尝试获取级别 "${normalizedLevel}" 的单词数量...`)

    // 方法1: 尝试使用RPC函数获取特定级别的单词数量
    try {
      const { data, error } = await supabase.rpc("get_word_count_by_level", {
        level_param: normalizedLevel,
      })

      if (!error && data !== null) {
        console.log(`RPC函数查询: 级别 "${normalizedLevel}" 有 ${data} 个单词`)
        return data
      }

      console.log("RPC函数未返回数据或发生错误:", error)
    } catch (rpcError) {
      console.error("RPC函数异常:", rpcError)
    }

    // 方法2: 使用计数查询
    const { count, error } = await withRetry(
      () => supabase.from("dictionary").select("*", { count: "exact", head: true }).ilike("level", normalizedLevel),
      3,
    )

    if (error) {
      console.error(`获取 ${normalizedLevel} 级单词数量失败:`, error)
      isUsingMockData = true
      return getMockLevelCount(normalizedLevel)
    }

    console.log(`级别 "${normalizedLevel}" 有 ${count || 0} 个单词`)
    return count || 0
  } catch (error) {
    console.error("获取单词数量失败:", error)
    isUsingMockData = true
    return getMockLevelCount(level.trim().toUpperCase())
  }
}

// 获取模拟的特定级别单词数量
function getMockLevelCount(level: string): number {
  const mockCounts: Record<string, number> = {
    A: 244,
    B: 267,
    C: 290,
    D: 265,
    E: 278,
  }

  return mockCounts[level] || 0
}

// 模拟数据函数 - 当 Supabase 连接失败时使用
function getMockLevelCounts(): LevelCount[] {
  console.log("使用模拟的难度级别数据")
  isUsingMockData = true
  return [
    { level: "A", count: 244 },
    { level: "B", count: 267 },
    { level: "C", count: 290 },
    { level: "D", count: 265 },
    { level: "E", count: 278 },
  ]
}

function getMockLevels(): string[] {
  console.log("使用模拟的难度级别列表")
  isUsingMockData = true
  return ["A", "B", "C", "D", "E"]
}

function getMockWordsByLevel(level: string, limit: number): DictionaryWord[] {
  console.log(`使用模拟的 ${level} 级单词数据`)
  isUsingMockData = true
  const mockWords: DictionaryWord[] = []

  // 根据不同级别生成不同的模拟单词
  const words = {
    A: [
      { word: "apple", translation: "苹果" },
      { word: "banana", translation: "香蕉" },
      { word: "cat", translation: "猫" },
      { word: "dog", translation: "狗" },
      { word: "egg", translation: "鸡蛋" },
    ],
    B: [
      { word: "flower", translation: "花" },
      { word: "garden", translation: "花园" },
      { word: "house", translation: "房子" },
      { word: "ice", translation: "冰" },
      { word: "juice", translation: "果汁" },
    ],
    C: [
      { word: "kitchen", translation: "厨房" },
      { word: "library", translation: "图书馆" },
      { word: "mountain", translation: "山" },
      { word: "notebook", translation: "笔记本" },
      { word: "orange", translation: "橙子" },
    ],
    D: [
      { word: "pencil", translation: "铅笔" },
      { word: "queen", translation: "女王" },
      { word: "river", translation: "河流" },
      { word: "school", translation: "学校" },
      { word: "teacher", translation: "老师" },
    ],
    E: [
      { word: "umbrella", translation: "雨伞" },
      { word: "violin", translation: "小提琴" },
      { word: "window", translation: "窗户" },
      { word: "xylophone", translation: "木琴" },
      { word: "yellow", translation: "黄色" },
    ],
  }

  // 获取当前级别的单词，如果没有则使用 A 级
  const levelWords = words[level as keyof typeof words] || words["A"]

  // 生成指定数量的模拟单词
  for (let i = 0; i < Math.min(limit, 100); i++) {
    const wordIndex = i % levelWords.length
    mockWords.push({
      id: i + 1,
      word: levelWords[wordIndex].word,
      translation: levelWords[wordIndex].translation,
      level: level,
    })
  }

  return mockWords
}

function getMockRandomWords(limit: number): DictionaryWord[] {
  console.log("使用模拟的随机单词数据")
  isUsingMockData = true

  // 合并所有级别的单词
  const allWords: DictionaryWord[] = [
    ...getMockWordsByLevel("A", 20),
    ...getMockWordsByLevel("B", 20),
    ...getMockWordsByLevel("C", 20),
    ...getMockWordsByLevel("D", 20),
    ...getMockWordsByLevel("E", 20),
  ]

  // 随机排序并返回指定数量
  return allWords.sort(() => Math.random() - 0.5).slice(0, limit)
}
