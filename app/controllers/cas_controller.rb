class CasController < ApplicationController
  require 'RMMSegProxy'

  # /q?t[ID]=ARTICLE&t[ID2]=ARTICLE2&t[ID3][message]=lalaa
  def query
    terms = params[:t] || {}
    render :json => recursive(params[:t])
  end

private
  def recursive obj
    ret = {}
    unless obj.nil?
      obj.each do |key, val|
        if val.class != String
          ret[key] = recursive val
        else
          ret[key] = do_segmentation val
        end
      end
    end
    return ret
  end
  def do_segmentation term
    seg(term).join(' ')
  end

end
