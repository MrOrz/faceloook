class FbController < ApplicationController
  def channel
    render :text => '<script src="https://connect.facebook.net/en_US/all.js"></script>'
  end
end
