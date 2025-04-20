-- 创建获取特定级别单词数量的函数
CREATE OR REPLACE FUNCTION get_word_count_by_level(level_param text)
RETURNS integer AS $
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM dictionary
    WHERE UPPER(level) = UPPER(level_param)
  );
END;
$ LANGUAGE plpgsql;
