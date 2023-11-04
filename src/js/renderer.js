new Vue({
    el: "#body-container",
    data() {
        return {
            langRes:null,

            videoExtArr:['mp4','avi','mkv','mov','flv','mpeg','mpg','ts'],
            // audioExtArr:['mp3','wav','aiff','au','wma','flac','ogg','aac','ra','rm'],
            // imageExtArr:['jpg','jpeg','png','gif','bmp','tiff'],

            fileDataStatus:null,
            fileData:[],
            tableLoading:false,
            pageIndex: 1,
            pageSize: 500,
            multipleSelection: [],

            convertIng:false,

            convertOptions:{
                taskThreadsNumber:2,
                newFormat:null,
                outputPath:''
            }
        }
    },
    computed:{
        filePageData(){
            this.multipleSelection=[];
            return this.fileData.slice((this.pageIndex-1)*this.pageSize,this.pageIndex*this.pageSize);
        },

        fileConvertPercent(){
            if(this.fileData.length==0)
                return 0;
            var filterData = this.fileData.filter(item => {
                return item.status == 2 || item.status == 3
            });
            
            return parseInt((filterData.length/this.fileData.length)*100,10);
        }
    },
    mounted() {
        setTimeout(()=>{
            document.title = this.lang("title");
            this.fileDataStatus = {
                0:this.lang('unConvert'),
                1:this.lang('convertIng'),
                2:this.lang('convertSuccess'),
                3:this.lang('convertFail'),
            }
        },100)
    },
    methods: {
        isNullOrEmpty(str) {
            if (str == null || typeof str == "undefined" || String(str).trim() == "")
                return true;
            else
                return false;
        },

        toNum(str){
            if(this.isNullOrEmpty(str) || isNaN(str))
                return null;
            else
                return Number(str);
        },

        //multilingual
        getLangStr(key){
            var keyArr=key.split('.');
            var langObj=this.langRes[keyArr[0]];
            for(var i=1;i<keyArr.length;i++){
                langObj=langObj[keyArr[i]];
            }
            return langObj;
        },
        lang(key){
            if(this.langRes==null){
                window.customApi.getLangRes()
                .then(data=>{
                    this.langRes=data;
                    return this.getLangStr(key);
                })
                .catch((e) => {
                    return key;
                });
            }else{
                return this.getLangStr(key);
            }
        },

        openFileDialog(){
            electronAPI.openFile(this.videoExtArr)
            .then(filePaths=>{
                if(filePaths!=null && filePaths.length>0){
                    this.tableLoading=true;
                    setTimeout(()=>{
                        for(var i=0;i<filePaths.length;i++){
                            var filterData = this.fileData.filter(item => {
                                return item.sourcePath == filePaths[i]
                            });
                            if(filterData.length>0){
                                continue;
                            }
                            this.fileData.push({
                                sourcePath:filePaths[i],
                                sourceSize:null,
                                sourceFormat:filePaths[i].substr(filePaths[i].lastIndexOf('.')+1),
                                newPath:null,
                                newSize:null,
                                newFormat:this.convertOptions.newFormat,
                                status:0,
                                convertPercent:0
                            });

                            electronAPI.getVideoOrAudioMetaData(filePaths[i],(metaData)=>{
                                var filterData = this.fileData.filter(item => {
                                    return item.sourcePath == metaData.format.filename
                                });
                                filterData[0].sourceSize=metaData.format.size;
                                filterData[0].sourceBitRate=metaData.format.bit_rate;
                                for(var k=0;k<metaData.streams.length;k++){
                                    if(metaData.streams[k].codec_type=='video'){
                                        filterData[0].sourceFrameRate=this.toNum(metaData.streams[k].r_frame_rate.split('/')[0]);
                                        filterData[0].sourceWidth=metaData.streams[k].width;
                                        filterData[0].sourceHeight=metaData.streams[k].height;
                                        break;
                                    }
                                }
                                console.log(metaData)
                            });
                        }
                        this.tableLoading=false;
                    },50);
                }
            });
        },

        async openDirectory(dirType){
            const dirPaths = await window.electronAPI.openDirectory()
            if(dirPaths==null || dirPaths=='')
                return;
            if(dirType=="output"){
                this.convertOptions.outputPath = dirPaths
            }else if(dirType=="input"){
                var fileData = window.electronAPI.getFilesFromDir(dirPaths,this.videoExtArr);
                if(fileData!=null && fileData.length>0){
                    this.tableLoading=true;
                    setTimeout(()=>{
                        for(var i=0;i<fileData.length;i++){
                            var filterData = this.fileData.filter(item => {
                                return item.sourcePath == fileData[i].filePath
                            });
                            if(filterData.length>0){
                                continue;
                            }
    
                            this.fileData.push({
                                sourcePath:fileData[i].filePath,
                                sourceSize:null,
                                sourceFormat:fileData[i].filePath.substr(fileData[i].filePath.lastIndexOf('.')+1),
                                newPath:null,
                                newSize:null,
                                newFormat:this.convertOptions.newFormat,
                                status:0,
                                convertPercent:0
                            });

                            electronAPI.getVideoOrAudioMetaData(fileData[i].filePath,(metaData)=>{
                                var filterData = this.fileData.filter(item => {
                                    return item.sourcePath == metaData.format.filename
                                });
                                filterData[0].sourceSize=metaData.format.size;
                                filterData[0].sourceBitRate=metaData.format.bit_rate;
                                for(var k=0;k<metaData.streams.length;k++){
                                    if(metaData.streams[k].codec_type=='video'){
                                        filterData[0].sourceFrameRate=this.toNum(metaData.streams[k].r_frame_rate.split('/')[0]);
                                        filterData[0].sourceWidth=metaData.streams[k].width;
                                        filterData[0].sourceHeight=metaData.streams[k].height;
                                        break;
                                    }
                                }
                            });
                        }
                        this.tableLoading=false;
                    },50);
                }
            }
        },

        showConvertStatus(status){
            if(status==0){
                return this.fileDataStatus[status];
            }else if(status==1){
                return "<span style='color:#409EFF'>"+this.fileDataStatus[status]+"</span>";
            }else if(status==2){
                return "<span style='color:#67C23A'>"+this.fileDataStatus[status]+"</span>";
            }else if(status==3){
                return "<span style='color:#F56C6C'>"+this.fileDataStatus[status]+"</span>";
            }
        },

        pageIndexChange(e) {
            this.pageIndex = e;
        },
        pageSizeChange(e) {
            this.pageSize = e;
            this.pageIndex =1
        },

        dataListMultiSelect(val) {
            this.multipleSelection = [];
            if(val!=null && val.length>0){
                val.forEach((item) => {
                    this.multipleSelection.push(item.sourceFilePath);
                });
            }
        },

        delFileData(){
            this.$confirm(this.lang('delConfirm'), this.lang('tip'), {
                confirmButtonText: this.lang('ok'),
                cancelButtonText: this.lang('cancel')
            }).then(() => {
                var startIndex=this.pageIndex*this.pageSize;
                if(startIndex>this.fileData.length)
                    startIndex=this.fileData.length;
                startIndex=startIndex-1;
                for(var i=startIndex;i>=(this.pageIndex-1)*this.pageSize;i--){
                    if(this.multipleSelection.includes(this.fileData[i].sourceFilePath)){
                        this.fileData.splice(i,1);
                    }
                }
                this.$message({
                    type: 'success',
                    message: this.lang('delSuccess')
                });
            });
        },

        renameForNewFile(filePath){
            if(electronAPI.fileExists(filePath)){
                return this.renameForNewFile(filePath.replace(".","(1)."));
            }
            return filePath;
        },

        newFormatChange(e){
            this.convertOptions.newFormat=e;
            for(var i=0;i<this.fileData.length;i++){
                this.fileData[i].newFormat=e;
            }
        },

        goConvert(){
            if(this.fileConvertPercent==100)
                return;
            if(this.convertIng){
                this.convertIng=false;

                //At present, canceling the task is not true, and no implementation method for terminating the ffmpeg command has been found
                var filterData = this.fileData.filter(item => {
                    return item.status == 1
                });
                for(var i=0;i<filterData.length;i++){
                    filterData[i].status=0;
                    filterData[i].convertPercent=0;
                }
                return;
            }

            var newFormatNoSettingData = this.fileData.filter(item => {
                return item.newFormat == null
            });
            if(newFormatNoSettingData.length>0){
                this.$message.warning(this.lang('newFormatNoSettingTip'));
                return;
            }
            
            this.$refs['convertOptionsForm'].validate((valid) => {
                if (valid) {
                    this.convertIng=true;
                    this.convertStart();
                }
            });
        },

        convertStart(){
            for(var i=0;i<this.fileData.length;i++){
                if(!this.convertIng)
                    return;
                
                var filterData = this.fileData.filter(item => {
                    return item.status == 1
                });
                if(filterData.length==this.convertOptions.taskThreadsNumber){
                    return;
                }

                if(this.fileData[i].status!=0){
                    continue;
                }

                ((j)=>{
                    var outputPath=this.convertOptions.outputPath.replace(/\\/g,"/");
                    if(outputPath.length==outputPath.lastIndexOf("/")+1){
                        outputPath=outputPath.substr(0,outputPath.length-1);
                    }
                    var sourcePath = this.fileData[j].sourcePath.replace(/\\/g,"/");
                    outputPath=outputPath+sourcePath.substr(sourcePath.lastIndexOf('/'));
                    outputPath=outputPath.substr(0,outputPath.lastIndexOf('.')+1)+this.fileData[j].newFormat;
                    outputPath=this.renameForNewFile(outputPath); //If you need to overwrite an existing file, please comment out this line of code
    
                    this.fileData[j].status=1;
                    this.fileData[j].newTmpPath=outputPath;

                    electronAPI.execFfmpeg(this.fileData[j].sourcePath, outputPath, null,(progress,output)=>{
                        if(this.fileData[j].newTmpPath!=output)return;
                        this.fileData[j].convertPercent=progress.percent.toFixed(1);
                    },(output)=>{
                        if(!this.convertIng || this.fileData[j].newTmpPath!=output){
                            electronAPI.removeFile(output);
                            return
                        };
                        this.fileData[j].status=2;
                        this.fileData[j].newPath=outputPath;
                        this.convertStart();
                        this.convertOver();
                        electronAPI.getVideoOrAudioMetaData(outputPath,(metaData)=>{
                            this.fileData[j].newSize=metaData.format.size;
                            this.fileData[j].newBitRate=metaData.format.bit_rate;
                            for(var k=0;k<metaData.streams.length;k++){
                                if(metaData.streams[k].codec_type=='video'){
                                    this.fileData[j].newFrameRate=metaData.streams[k].r_frame_rate.split('/')[0];
                                    this.fileData[j].newWidth=metaData.streams[k].width;
                                    this.fileData[j].newHeight=metaData.streams[k].height;
                                    break;
                                }
                            }
                            console.log(metaData)
                        });
                    },(output)=>{
                        electronAPI.removeFile(output);
                        if(!this.convertIng){
                            return
                        };
                        this.fileData[j].status=3;
                        this.convertStart();
                        this.convertOver();
                    });
                })(i);
            }
        },

        convertOver(){
            if(this.fileConvertPercent==100){
                setTimeout(() => {
                    this.$alert(this.lang('convertOver'), this.lang('tip'), {
                        confirmButtonText: this.lang('ok'),
                        callback: action => {
                            this.convertIng=false;
                        }
                    });
                }, 800);
            }
        },

        openBrowser(url){
            window.electronAPI.openBrowser(url);
        },

        openPath(url){
            window.electronAPI.openPath(url);
        }
    }
});