-- 创建获取级别计数的存储过程
CREATE OR REPLACE FUNCTION get_level_counts_sql()
RETURNS TABLE (level text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT d.level, COUNT(*) AS count
  FROM dictionary d
  WHERE d.level IS NOT NULL
  GROUP BY d.level
  ORDER BY d.level;
END;
$$ LANGUAGE plpgsql;

-- 创建获取随机单词的存储过程
CREATE OR REPLACE FUNCTION get_random_words_sql(limit_count integer)
RETURNS SETOF dictionary AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM dictionary
  ORDER BY random()
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 创建批量导入单词的存储过程
CREATE OR REPLACE FUNCTION import_words(words jsonb)
RETURNS integer AS $$
DECLARE
  inserted integer := 0;
  word_record record;
BEGIN
  -- 遍历JSON数组中的每个单词
  FOR word_record IN SELECT * FROM jsonb_to_recordset(words) AS x(word text, translation text, level text)
  LOOP
    -- 插入单词
    INSERT INTO dictionary (word, translation, level)
    VALUES (word_record.word, word_record.translation, word_record.level);
    
    inserted := inserted + 1;
  END LOOP;
  
  RETURN inserted;
END;
$$ LANGUAGE plpgsql;

-- 创建按级别分组计数的函数
CREATE OR REPLACE FUNCTION count_words_by_level()
RETURNS TABLE (level text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT d.level, COUNT(*) AS count
  FROM dictionary d
  WHERE d.level IS NOT NULL
  GROUP BY d.level
  ORDER BY d.level;
END;
$$ LANGUAGE plpgsql;

-- 创建获取唯一级别的函数
CREATE OR REPLACE FUNCTION get_unique_levels()
RETURNS TABLE (level text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT d.level
  FROM dictionary d
  WHERE d.level IS NOT NULL
  ORDER BY d.level;
END;
$$ LANGUAGE plpgsql;
