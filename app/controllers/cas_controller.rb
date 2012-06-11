class CasController < ApplicationController
  require 'RMMSegProxy'

  def query
    render :json => seg(params[:term])
  end
end
