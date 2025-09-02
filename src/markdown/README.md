帮我在m:a 命令中支持一个-p参数，这个参数后面跟着一个路径映射表的json文件，文件中是：
{
  "01-测试": "01-test",
  "02-开发": "02-develop"
}
使用此map表的时候，创建md文档时，获取到要创建的文档所在目录的绝对路径，检查内部是否含有sdoc，若有，则从sdoc开始截断，对后面的路径一一按照映射表进行查找映射为映射后的路径，若没有有效的映射，则提示并退出创建，若都有，则为permalink添加这个路径，例如：
tdoc m:n -d sdoc/01-测试 LV01-测试 -p，这个时候，应该在sdoc/01-测试目录创建LV01-测试 .md，并且，内部的permalink应该为/sdoc/01-test/docs/xxxxxxxxxxxxxxxxxxxxxx
