class CasController < ApplicationController
  require 'RMMSegProxy'

  def query
    render :text => seg(params[:term]).join(' ')
  end
end
