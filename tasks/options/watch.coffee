module.exports = () ->
  coffee:
    files: ['<%= srcDir%>/src/coffee/**/*.coffee', '<%= demo %>/src/coffee/**/*.coffee']
    tasks: ['newer:coffee:all']
  sass:
    files: ['<%= srcDir%>/src/scss/**/*.scss', '<%= demo %>/src/scss/**/*.scss']
    tasks: ['newer:sass:all']
    
