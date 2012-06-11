#encoding: utf-8
require 'rmmseg'
require 'rmmseg/simple_algorithm'
RMMSeg::Config.dictionaries = [["data/tsi.src", true],
                               ["data/chars_t.dic", true],
                               ["data/pun_t.dic", false]]
RMMSeg::Dictionary.instance.reload
RMMSeg::Config.max_word_length = 8 
RMMSeg::Config.algorithm = :simple

def seg text
  return RMMSeg::Config.algorithm_instance(text).segment
end
