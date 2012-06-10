require 'rmmseg'
require 'rmmseg/simple_algorithm'

RMMSeg::Config.dictionaries = [["./words_t.dic", false],
                               ["./chars_t.dic", true],
                               ["./pun_t.dic", false]]
RMMSeg::Config.max_word_length = 6
RMMSeg::Config.algorithm = :simple

def seg text
  return RMMSeg::Config.algorithm_instance(text).segment
end