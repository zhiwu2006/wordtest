-- 创建批量导入单词的存储过程
CREATE OR REPLACE FUNCTION import_words(words jsonb)
RETURNS TABLE (inserted_count integer) AS $$
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
  
  RETURN QUERY SELECT inserted;
END;
$$ LANGUAGE plpgsql;
