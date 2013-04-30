use Rack::Static,
  :urls => ["/data", "/css", "/js"],
  :root => "public"

run lambda { |env|
  [
    200,
    {
      'Content-Type'  => 'text/html',
      'Cache-Control' => 'public, max-age=86400'
    },
    File.open('public/jflowmap-js.html', File::RDONLY)
    
  ]
}
