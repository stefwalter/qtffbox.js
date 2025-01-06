module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        separator: '',
        process: function(src, filepath) {
          return '// file:' + filepath + '\n' + src;
        }
      },
      all: {
        src: [
          'src/qtffbox.js'                    // main file
        ],
        dest: 'dist/<%= pkg.name %>.all.js'
      },
      simple: {
        src: [
          'src/qtffbox.js'
        ],
        dest: 'dist/<%= pkg.name %>.simple.js'
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
        sourceMap: true
      },
      all: {
        files: {
          'dist/<%= pkg.name %>.all.min.js': ['<%= concat.all.dest %>']
        }
      },
      simple: {
        files: {
          'dist/<%= pkg.name %>.simple.min.js': ['<%= concat.simple.dest %>']
        }
      },
    },
    jshint: {
      files: [
        'Gruntfile.js',
        'src/**/*.js',
        'test/**/*.js',
        // Exclude the following from lint
        '!test/lib*/**/*.js',
        '!test/mp4/**/*.js',
        '!test/trackviewers/**/*.js',
        '!test/coverage/**/*.js',
      ],
      options: {
        // options here to override JSHint defaults
        eqeqeq: false,
        asi: true,
        //verbose: true,
	      loopfunc: true,
        eqnull: true,
	      reporterOutput: "",
          globals: {
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['default']
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js'
      }
    },
    bump: {
      options: {
        files:  ['package.json'],
        pushTo: 'origin'
      }
    },
    coveralls: {
        options: {
            coverageDir: 'test/coverage/',
            force: true
        }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-karma-coveralls');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('all', [ 'concat:all', 'uglify:all']);
  grunt.registerTask('simple', [ 'concat:simple', 'uglify:simple']);
  grunt.registerTask('default', [ 'jshint', 'all', 'simple']);
  grunt.registerTask('test', ['default']);
};
