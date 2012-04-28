# A sample Guardfile
# More info at https://github.com/guard/guard#readme

# verify that application Javascript files are lintable
# see https://github.com/psionides/jslint_on_rails
guard 'jshint-on-rails', :config_path => 'jslint.yml' do
  # watch for changes to application javascript files
  watch(%r{^js/.*\.js$})
end

guard 'compass', :configuration_file => './config/compass.rb' do
  watch(%r{sass/.+\.s[c|a]ss})
end

