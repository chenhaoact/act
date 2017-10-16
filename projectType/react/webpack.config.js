//使用nodejs的path模块 path.resolve(__dirname) 就是项目的根目录 详细参考：https://nodejs.org/docs/latest/api/path.html 和 https://www.npmjs.com/package/path
const path = require('path');

const webpack = require('webpack');

// 导入非 webpack 默认自带插件
// Extract text from a bundle, or bundles, into a separate file 参考：https://webpack.js.org/plugins/extract-text-webpack-plugin/
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlwebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
// 使用clean-webpack-plugin插件，打包之前删除打包的文件夹及其文件，以便重新进行打包，避免原来打包文件堆积
const CleanPlugin = require('clean-webpack-plugin');


const config = {
    // entry，入口，指定要打包成的文件，webpack 从这里开始打包构建
    entry: {
        //提取第三方库，单独打包到venders.js，提升性能，不要和业务代码混在一起，需配合下面的插件 new webpack.optimize.CommonsChunkPlugin使用
        vendors: ['react', 'react-dom', 'react-router'],
        /**
         * 多页面配置，如果在src/pages下添加了新的页面，需要在这里增加新页面的配置
         * */
        index: path.resolve(__dirname, 'src/pages/index/index.jsx'),
        page2: path.resolve(__dirname, 'src/pages/page2/index.jsx'),
    },
    // output，webpack如何输出结果的相关配置
    output: {
        //构建文件打包输出到build下 输出文件的和入口对应
        path: path.resolve(__dirname, 'build'),
        // 打包的文件使用name+chunkhash命名一遍，以便更新迭代和加密;
        // entry目前处理的都是js文件，打包输出的js会放在build/js文件夹下,方便不同类型的打包文件分类(如js,css等)放置。
        filename: 'js/[name]-[chunkhash].js'
    },
    //模块配置,重要的loader配置写在这里
    module: {
        //module.rules 模块规则（配置加载器、解析器等选项）。webpack1原来的loader配置项在2之后被更强大的rules取代，后者允许配置loader及其他更多选项
        rules: [
            {
                test: /\.(js|jsx)$/, //js和jsx文件用babel处理
                //include定义哪些文件需要处理，exclude 是必不匹配选项（优先于 test 和 include）。指定include，缩小打包范围，提高打包速度,指定它就不用再指定exclude: /node_modules/ 了
                include: [
                    path.resolve(__dirname, "src")
                ],
                exclude: [],
                // 这里用babel处理js或jsx，https://babeljs.io/docs/setup/#installation
                loader: "babel-loader",
                //options：loader 的可选项,原来query中的配置写在这里
                options: {
                    // 使用这两种presets处理js(env支持最新版es6，如:2017年支持es2017)和jsx文件,需安装babel-preset-env(不用再安babel-preset-2015)和babel-preset-react，参考：https://babeljs.io/docs/plugins/preset-env/ ，https://babeljs.io/docs/plugins/preset-react/
                    presets: ["env", "react"],
                    cacheDirectory: true
                }
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader", //css-loader处理完后用style-loader插入到html的style标签中
                    use: "css-loader?minimize"
                })
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader', //下面的sass-loader和css-loader处理完后用style-loader插入到html的style标签中
                    use: ['css-loader?minimize', 'sass-loader'] //css-loader加?minimize参数，开启css压缩，参考https://doc.webpack-china.org/loaders/css-loader/最小化
                })
            },
            {
                //使用html-loader，对html文件进行文件加载优化和压缩，详细参考：https://doc.webpack-china.org/loaders/html-loader/
                test: /\.html$/,
                use: [{
                    loader: 'html-loader',
                    options: {
                        minimize: true //进行压缩
                    }
                }]
            },
            /**
             * 使用file-loader对这些文件类型进行打包处理,参考：https://github.com/webpack-contrib/file-loader
             * 图片文件等静态资源目前统一放在src/assets下，打包到build/assets下
             * 打包后文件在css中可以直接用相对路径，目前也可在jsx中使用相对路径:
             * 格式上需加require如： src={ require('../../assets/sidai-touxiang.png') }
             * 路径是src下相应代码相对于src/assets下对应图片等文件的相对路径
             * 建议文件最好传cdn；这里也可处理其他文件，如字体等，用到再添加相应webpack配置
             * */
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                //webpack2开始，使用多个loader建议写在use数组中
                use: [
                    //加？参数等效于写query后在里边配置各属性，一般多个loader连用写在loaders属性里时简易这样加参数去配置query。配置打包的文件名为name-hash值.文件后缀名，入口相关文件引用到的资源文件才会被打包
                    'file-loader?name=assets/[name]-[hash].[ext]',
                    //image-webpack-loader配合file-loader或url-loader，
                    // 可以压缩图片文件大小,默认可以压缩几倍到几十倍，压缩比与质量也可以灵活配置。参考 https://github.com/tcoopman/image-webpack-loader
                    'image-webpack-loader'
                ]
            }
        ]
    },
    // webpack插件配置
    plugins: [
        //TODO: 解决报错
        // 设置合适的环境变量能够，需要在生产环境中将NODE_ENV设置为production，帮助 Webpack 更好地去压缩处理依赖中的代码,减少包体大小,提升性能
        new webpack.DefinePlugin({ // <-- key to reducing React's size
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        // 构建之前先删除build目录下面的文件夹,使用clean-webpack-plugin插件，打包之前删除打包的文件夹及其文件，以便重新进行打包，避免原来打包文件堆积
        new CleanPlugin(['build']),
        //使用插件，将css单独打包，不打入js,提升页面加载速度和性能，参考插件使用：https://github.com/webpack-contrib/extract-text-webpack-plugin
        /**
         * 为支持多页面，这里各个入口js（即各页面）的css文件会分开以模块名-chunkhash值命名打包到css目录下
         * 各页面只用自己引用的css相关文件，减少引用无关的其他页面的css代码，提升性能
         */
        new ExtractTextPlugin('css/[name]-[chunkhash].css'),
        //ignoreplugin :用于忽略引入模块中并不需要的内容，减少打包文件大小，提升性能。譬如当我们引入moment.js时，我们并不需要引入该库中所有的区域设置，因此可以利用该插件忽略不必要的代码。
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        /**
         * 多页面支持:
         * 需要在下面配置中添加调用HtmlwebpackPlugin的方法处理各自的页面打包并应用需要的js
         *
         * 加其他页面添加到src/pages下的对应页面的目录下，如果要用到和主页面一样的react技术栈那就在chunks属性中加上vendors，否则只加其自己页面js名
         * 每增加一个页面，参考下面增加一个页面入口项
         * 各页面访问通过:域名/页面名.html即可访问该页面,如果不加.html文件名是默认放到主页面的路由中处理无法访问页面的
         * */
        //用插件HtmlwebpackPlugin,默认的页面为index.html，拿到src/pages/index/index.html当做模板构建后插入vendors.js和index.js的script标签。参考：https://www.npmjs.com/package/html-webpack-plugin
        new HtmlwebpackPlugin({
            // title: 'index', //指定页面html的title
            template: path.resolve(__dirname, 'src/pages/index/index.html'),
            filename: 'index.html',
            chunks: ['vendors', 'index'], //这里的chunks要和入口entry的对应name一致
            inject: 'body',
            minify: { //压缩HTML文件
                removeComments: true, //移除HTML中的注释
                collapseWhitespace: false //删除空白符与换行符
            }
        }),
        new HtmlwebpackPlugin({
            // title: 'page2',
            template: path.resolve(__dirname, 'src/pages/page2/index.html'),
            filename: 'page2.html',
            chunks: ['vendors', 'page2'],
            inject: 'body',
            minify: { //压缩HTML文件
                removeComments: true, //移除HTML中的注释
                collapseWhitespace: false //删除空白符与换行符
            }
        }),
        // webpack.optimize. 一些构建优化插件
        // 这个插件将多个打包结果中公共部分（比如共用类库）抽取出来，作为一个单独的文件vendors.js。参考：https://doc.webpack-china.org/plugins/commons-chunk-plugin/
        new webpack.optimize.CommonsChunkPlugin({name: 'vendors', filename: 'vendors.js'}),
        //TODO: 解决报错
        // 压缩js
        // new webpack.optimize.UglifyJsPlugin(),
        // 使用uglifyJs压缩js代码，提升性能。
        new webpack.optimize.UglifyJsPlugin({
            minimize: true //此配置已经是最小了，默认已去掉了注释等，不需要其他的配置。另外webpack2之后 UglifyJsPlugin 不再压缩 loaders。在未来很长一段时间里，需要通过设置 minimize:true 来压缩 loaders。
        }),
        //使用compression-webpack-plugin插件,将资源文件压缩为.gz文件，并且根据客户端的需求按需加载，提升性能。参考：https://www.npmjs.com/package/compression-webpack-plugin
        new CompressionPlugin({
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/,
            threshold: 10240,
            minRatio: 0
        }),
        //模块热更新
        new webpack.HotModuleReplacementPlugin(),
        /**
         * 使用插件webpack-bundle-analyzer来可视化分析包的大小：https://github.com/th0r/webpack-bundle-analyze 以便提升性能。
         * TODO:加上webpack-bundle-analyze，每次文件有更新后就会跑错，热更新监控有问题，排查下
         *
         * 注：平时开发时可以注释掉，以免每次都弹出分析包大小的页面，需要分析包大小进行性能优化的时候再去掉下面注释.
         * */
        new BundleAnalyzerPlugin()
    ]
};

module.exports = config;