class CasController < ApplicationController
  require 'YahooCAS'

  APPID = "N_XPkVrV34EdffJI6YyJb9ESkLxDgZ6hS3GpWQjVH.VKdu7qvtYa0xT3_SG.8lb1SLup.g--"

  def query
    render :text => yahooCAS.post("ws", {
      :appid => APPID,
      :content => params[:content],
      :format => 'json'
    })
  end
end
