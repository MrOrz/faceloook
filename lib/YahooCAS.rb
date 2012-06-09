require 'rest-core'

YahooCAS = RestCore::Builder.client do
  use DefaultSite, 'http://asia.search.yahooapis.com/cas/v1/'
  use CommonLogger, method(:puts)
  use Cache, {}, 3600
  run RestClient
end

def yahooCAS
  @yahooCAS = @yahooCAS || YahooCAS.new
end