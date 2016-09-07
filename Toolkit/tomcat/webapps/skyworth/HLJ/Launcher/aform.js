/*!
 * aform v1.5.1
 * Copyright 2015, xiehuiqi
 * Date: 2016��6��27��
 */

(function() {
    //���Ѵ��ڣ���ʹ��֮ǰ���ڵİ汾
    if (window.AForm) {
        if (typeof module === "object" && module.exports) {
            module.exports = window.AForm;
        }

        return window.AForm;
    }

    /** ���� */
    var AFORM_SYS_PLUGIN = "__AFORM_SYS_PLUGIN__";
    var AFORM_BASIC_PLUGIN = "__AFORM_BASIC_PLUGIN__";
    var AFORM_HTML_INPUT = "__AFORM_HTML_INPUT__";
    var AFORM_OBJ_PLUGIN = "__AFORM_OBJ_PLUGIN__";
    var AFORM_ARR_PLUGIN = "__AFORM_ARR_PLUGIN__";
    var AFORM_ARR_ROW_PLUGIN = "__AFORM_ARR_ROW_PLUGIN__";
    var controlInstance = {};
    var aformInstance = {};//aformʵ��
    var basicControl;
    var htmlInputControl;
    var objControl;
    var arrControl;
    var rowControl;
    var sysControl;

    /** ����Ⱦ���� */
    AForm.renderCount = 0;//����Ⱦ�Ŀؼ���
    AForm.formCount = 0;//�����ɵ�ʵ����
    /** �ⲿ������� */
    AForm.Plugin = {};
    AForm.Plugin.control = {};//�ؼ�
    AForm.Plugin.validator = {};//��֤��
    AForm.Plugin.adapter = {};//������
    AForm.Plugin.prop = {};//�Զ�������

    /** ȫ�����ú� */
    AForm.Config = {};
    AForm.Config.defaultDelimiter = ",";//Ĭ���ַ����ָ��������ڴ���ѡ��Ķ��Ÿ�����ֵ
    /** ����в��� */
    AForm.Config.defaultAction = {
        "aform_array_add_row": {
            html: "<a href='javascript:void(null)' title='����'>��</a>"
        },
        "aform_array_delete_row": {
            html: "<a href='javascript:void(null)' title='ɾ��'>��</a>"
        }
    };

    /** ��ǩ */
    AForm.Config.tags = {
        "basicContainer": "div",//div
        "objectContainer": "fieldset",
        "label": "label", //label
        "controlContainer": "" //Ĭ��Ϊ��
    };
    /** ������ʽ�� */
    AForm.Config.extClassName = {
        "basicContainer": "",//form-group
        "label": "",
        "table": "",//table table-bordered
        "control": "",//form-control
        "controlContainer": ""
    };
    /** ģ�� */
    AForm.Config.tpl = {
        "tips": "&nbsp;<a title='{tips}' href='#nolink'>[?]</a>",
        "thTips": "<sup title='{tips}'>[?]</sup>"
    };
    /** �İ� */
    AForm.Config.wording = {
        "numText": "NO.",
        "addRowText": "����",//����
        "oprText": "����",//����
        "deleteText": "ɾ��",//����
        "labelColon": "��", //��
        "fieldEmpty": "�ֶ�[{label}]����Ϊ��",
        "fieldInvalid": "�ֶ�[{label}]�Ƿ�"
    };

    /** ������ */
    AForm.Config.fn = {
        "showTips": function(input, errMsg) {
            alert(errMsg);
        },
        "hideTips": function(input) {
            //_debug(input.name + " value is valid");
        },
        "onEmpty": function(input, conf) {
            var name = input.getAttribute("name");

            var errMsg = conf ? _h.words("fieldEmpty", {label: conf.label}) : input.title;
            if (!errMsg) {
                errMsg = _h.words("fieldEmpty", {label: input.getAttribute("name")});
            }

            AForm.Config.fn.showTips(input, errMsg);
        },
        "onInvalid": function(input, conf, errorMsg) {
            var errMsg = errorMsg ? errorMsg : (conf ? _h.words("fieldInvalid", {label: conf.label}) : input.title);
            if (!errMsg) {
                errMsg = _h.words("fieldInvalid", {label: input.getAttribute("name")})
            }

            AForm.Config.fn.showTips(input, errMsg);
            if (typeof input.focus === "function" || typeof input.focus === "object") {
                input.focus();
            }
        },
        "onValid": function(input, conf) {
            AForm.Config.fn.hideTips(input);
        },
        "onGlobalInvalid": function(msg) {
            alert(msg);
        }
    };

    //��ʼ���¼�
    var validateEvt = {
        empty: function() {
            AForm.Config.fn.onEmpty.apply(AForm, arguments);
        },
        invalid: function() {
            AForm.Config.fn.onInvalid.apply(AForm, arguments);
        },
        valid: function() {
            AForm.Config.fn.onValid.apply(AForm, arguments);
        },
        globalInvalid: function() {
            AForm.Config.fn.onGlobalInvalid.apply(AForm, arguments);
        }
    };

    //helper
    var _formHelper = {
        $: function(id) {
            return document.getElementById(id);
        },
        stringTemplate: function(template, vars) {
            return template.replace(/\{(\w+)\}/, function(s, v) {
                return vars[v]
            });
        },
        words: function(key, vars) {
            return _h.stringTemplate(AForm.Config.wording[key], vars);
        },
        toArray: function(s) {
            try {
                return Array.prototype.slice.call(s);//ie8������https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice#Streamlining_cross-browser_behavior
            } catch (e) {
                var arr = [];
                for (var i = 0, len = s.length; i < len; i++) {
                    arr[i] = s[i];
                }
                return arr;
            }
        },
        indexOf: function(arr, fn) {
            var pos = -1;
            _h.each(arr, function(item, i) {
                if (fn(item)) {
                    pos = i;
                    return false;
                }
            });

            return pos;
        },
        isIE: function() {
            var myNav = navigator.userAgent.toLowerCase();
            return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
        },
        getInput: function(domEle, restrict) {
            if (_h.hasClass(domEle, "json-field-plugin")) {
                restrict = false;//�����ⲿ�Զ���ؼ����п��ܲ�������html�ϴ���data-gen=aform�ı�ǣ������Ҫ�����ϸ�ģʽΪfalse
            }
            var controlList = [];
            var ips = _h.toArray(domEle.getElementsByTagName("input"));
            var txts = _h.toArray(domEle.getElementsByTagName("textarea"));
            var sels = _h.toArray(domEle.getElementsByTagName("select"));

            var clTemp = ips.concat(txts).concat(sels);
            for (var ii = 0; ii < clTemp.length; ii++) {
                var ip = clTemp[ii];
                //���ԵĿؼ�����ȡֵ
                //�ϸ�ģʽ�£���aform���ɵ�input����ȡֵ
                if (_h.isIgnore(ip) || (restrict && ip.getAttribute("data-gen") != "aform")) {
                } else {
                    controlList.push(ip);
                }
            }

            return controlList;
        },
        removeArray: function(arr, fn) {
        	if(_h.getObjType(arr) !== "Array")return;
            var pos = _h.indexOf(arr, fn);
            if (pos > -1) {
                arr.splice(pos, 1);
            }
        },
        hasClass: function(ele, clsName) {
            if (!ele || !ele.nodeType == 1) {
                return false;
            }
            return (" " + ele.className).indexOf(" " + clsName) > -1;
        },
        isFormElement: function(ele) {
            var isEle = _h.hasClass(ele, "json-form-element") || _h.hasClass(ele, "json-field-plugin");
            return isEle && !_h.isIgnore(ele);
        },
        isIgnore: function(ele) {
            if (!ele || !ele.getAttribute) {
                return false;
            }
            return ele.getAttribute("ignore") == "true" || ele.getAttribute("ignore") == "ignore";
        },
        addClass: function(ele, clsName) {
            if (!ele || !clsName) {
                return false;
            }
            if (!ele.className) {
                ele.className = clsName;
            }
            else if (!_formHelper.hasClass(ele, clsName)) {
                ele.className += " " + clsName;
            }
        },
        validateInput: function(input, conf, af)//������֤����ؼ���value
        {
            var v = input.value;
            return validateInput(af, input, v, conf);
        },
        getParent: function(ele, ptag) {
            ptag = ptag.toUpperCase();
            var p = ele.parentNode;
            while (p && p.tagName != ptag) {
                p = p.parentNode;
            }

            return p;
        },
        getNextSibling: function(n) {
            var x = n.nextSibling;
            while (x && x.nodeType != 1) {
                x = x.nextSibling;
            }
            return x;
        },
        showNextSibling: function(ele, visible) {
            var n = this.getNextSibling(ele);
            while (n) {
                var isHidden = n.getAttribute("hidden") != null;//����html5��hidden����
                n.style.display = isHidden ? "none" : (visible ? "" : "none");
                n = this.getNextSibling(n);
            }
        },
        getTarget: function(e) {
            e = e || window.event;
            return e.target || e.srcElement;
        },
        addEvent: function(ele, evt, fn) {
            if (ele.attachEvent) {
                return ele.attachEvent('on' + evt, fn);
            }
            else {
                return ele.addEventListener(evt, fn, false);
            }
        },
        exeCmd: function(e, tbid, rowAction, fnBefore, fnAfter, afObj) {
            var target = _h.getTarget(e);
            var cmd = target.getAttribute("cmd");
            if (!cmd) {
                return false;
            }
            var table = _formHelper.getParent(target, "table");

            //��Ҫ������¼�Դtable�����¼��󶨣�����ǰ�������¼�����Դȴ���Ǹ�table������ð�ݴ��ϵ��¼�������֮����ֹ��������
            if (table && table.id != tbid) {
                return false;
            }
            var row = _formHelper.getParent(target, "tr");

            if (cmd == "aform_array_collapse_table") {//����table
                var show = true;

                if (_formHelper.hasClass(target, "json-form-ctrl-un-collapse")) {
                    target.className =
                        target.className.replace("json-form-ctrl-un-collapse", "json-form-ctrl-collapse");
                    show = false;//��Ҫ�۵�
                } else if (_formHelper.hasClass(target, "json-form-ctrl-collapse")) {
                    target.className =
                        target.className.replace("json-form-ctrl-collapse", "json-form-ctrl-un-collapse");
                }

                _formHelper.showNextSibling(_formHelper.getParent(target, "caption"), show);
                _formHelper.showNextSibling(target, show);
            } else if (cmd == "aform_array_collapse_fieldset") {
                var show = true;

                if (_formHelper.hasClass(target, "json-form-ctrl-un-collapse")) {
                    target.className =
                        target.className.replace("json-form-ctrl-un-collapse", "json-form-ctrl-collapse");
                    show = false;
                } else if (_formHelper.hasClass(target, "json-form-ctrl-collapse")) {
                    target.className =
                        target.className.replace("json-form-ctrl-collapse", "json-form-ctrl-un-collapse");
                }

                _formHelper.showNextSibling(_formHelper.getParent(target, "legend"), show);
            } else if (cmd == "aform_array_add_row") {//Ĭ�������Ϊ
                (_joinFunction(fnBefore, window, ["aform_array_add_row", table]) !== false) &&
                _formHelper.addRow(table, afObj);
                _joinFunction(fnAfter, window, ["aform_array_add_row", table]);//after
            } else if (cmd == "aform_array_delete_row") {//Ĭ��ɾ���е���Ϊ
                if (!table) {
                    return false;
                }
                if (fnBefore.length) {
                    (_joinFunction(fnBefore, window, ["aform_array_delete_row", row]) !== false) &&
                    _formHelper.removeRow(row);
                }
                else {
                    if (!confirm("ȷ��ɾ��������")) {
                        return false;
                    }
                    _formHelper.removeRow(row);
                }
                _joinFunction(fnAfter, window, ["aform_array_delete_row", row, table]);//after
            } else {//ִ���Զ����
                for (var icmd in rowAction) {
                    var item = rowAction[icmd];
                    if (icmd == cmd && typeof item.handler == "function") {
                        var ret = true;
                        if (fnBefore.length) {
                            ret = _joinFunction(fnBefore, window, [icmd, row, table]);
                        }
                        ret && item.handler(row, table, icmd);
                        _joinFunction(fnAfter, window, [icmd, row, table]);//after
                        break;
                    }
                }
            }
        },
        isObjEmpty: function(obj) {
            if (!obj || obj.length) {
                return true;
            }//���鲻�Ϸ�����Ϊ�ǿ�
            for (var p in obj) {
                return false;
            }
            return true;
        },
        isInArray: function(key, array) {
            var i = array.length;
            while (i--) {
                if (key == array[i]) {
                    return true;
                }
            }
            return false;
        },
        removeRow: function(row) {
            var tbBody = row.parentNode;
            if (tbBody.rows.length == 1 && !tbBody.tempRow)//��ֻ��һ���ˣ���洢����Ϊ������ʱ�У������´α��������
            {
                row.cells[0].innerHTML = 0;//��ʼΪ0��addRow�󣬽�����1��֮��������row�����Ϊ0��������clone�������ã�����Ϊie����δ�ڱ���е�rowȡcell�ᱨ��
                tbBody.tempRow = row.cloneNode(true);
            }
            tbBody.removeChild(row);
        },
        addRow: function(table, af) {
            if (!table) {
                return;
            }
            var jpath = table.getAttribute("jpath");

            var fd = af.getConfigByPath(jpath);
            if (!fd) {
                return;
            }

            af.emit("beforeRender");
            var newData = _genDefaultData(fd.fields) || "";
            var curRowLength = table.rows.length == 0 ? 0 :
                (_h.hasClass(table.rows[0], "aform-array-header") ? (table.rows.length - 1) : table.rows.length);
            var newIndex = curRowLength;
            var rowHtml = rowControl.render(newIndex, newData, fd, AForm.renderCount, af, jpath);
            var tBody = table.tBodies[0];
            if (!tBody) {
                return false;
            }

            var tempDiv = document.createElement("div");
            tempDiv.innerHTML = "<table>" + rowHtml + "</table>";
            tBody.appendChild(tempDiv.getElementsByTagName("table")[0].rows[0]);

            af.emit("renderComplete");
        },
        trim: function(s) {
            if (typeof s != "string") {
                return s;
            }
            if (s.trim) {
                return s.trim();
            }
            else {
                return s.replace(/(^\s+)|(\s+$)/g, "");
            }
        },
        each: function(array, fn) {
            var len = array.length;
            for (var i = 0; i < len; i++) {
                var ret = fn(array[i], i);
                if (ret === false) {
                    break;
                }
            }
        },
        objEach: function(obj, fn) {
            obj = obj || {};
            for (var p in obj) {
                if (!obj.hasOwnProperty(p)) {
                    continue;
                }

                if (fn(p, obj[p]) === false) {
                    break;
                }
            }
        },
        getObjType: function(obj) {
            if (obj === undefined) {
                return "undefined";
            }
            if (obj === null) {
                return "null";
            }
            if (obj.constructor == Array) {
                return "Array";
            }
            if (obj.constructor == Array) {
                return "Array";
            }
            else if (obj.constructor == Object) {
                return "Object";
            }
            else if (obj.constructor == Number) {
                return "Number";
            }
            else if (obj.constructor == Boolean) {
                return "Boolean";
            }
            else if (obj.constructor == String) {
                return "String";
            }
            else {
                return "unknow";
            }
        },
        extend: function(obj, base) {
            if (!obj) {
                obj = {};
            }
            if (!base) {
                return obj;
            }
            for (var p in base) {
                obj[p] = base[p];
            }

            return obj;
        },
        obj2str: function(obj, sep) {
            var arr = [];
            for (var p in obj) {
                arr.push(p + "=\"" + obj[p] + "\"");
            }
            return arr.join(sep || " ");
        }
    };
    var _h = _formHelper;

    //ȫ�־�̬����

    /**
     * @description ����һ��aformʵ������ new ���һ��
     */
    AForm.create = function(arg1, arg2) {
        return new AForm(arg1, arg2);
    };

    /**
     * @description ���ݱ�id��ȡһ��aformʵ������ new ���һ��
     */
    AForm.get = function(id) {
        return aformInstance[id];
    };

    /**
     * @description ע������ؼ�
     * @param {String} name  �ؼ���
     * @param {Object} obj ���̳еĿؼ�����ؼ�����
     * @param {Object} obj2 �ؼ����壬�޼̳�ʱ�޸ò���
     */
    AForm.registerControl = function(name, obj, obj2) {
        if (typeof name != "string") {
            _debug("invalid control param");
            return false;
        }

        //δʹ�ü̳�
        var proto;
        if (typeof obj == "object") {
            proto = obj;
        } else if (typeof obj == "string") {
            //ʹ���˼̳з�ʽ
            var superName = obj;
            if (!(superName in AForm.Plugin.control)) {
                //_debug(superName + " not exist");
                return false;
            }
            var __super = AForm.Plugin.control[superName].prototype;
            if (!__super) {
                //_debug(superName + " not exist");
                return false;
            }

            var t = _h.extend({}, __super);
            obj2 = _h.extend(t, obj2);
            obj2.__super = __super;
            proto = obj2;
        }

        AForm.Plugin.control[name] = function() {
        };
        AForm.Plugin.control[name].prototype = proto;
    };

    /**
     * @description ע���Զ�������
     * @param {String} name  ������������ÿո����
     * @param {Object} obj �ؼ�����
     */
    AForm.registerProp = function(name, obj) {
        var name = name.split(/\s+/g);
        _h.each(name, function(n) {
            AForm.Plugin.prop[n] = obj;
        })
    };

    /**
     * @description ע����֤��
     * @param {String} name  �ؼ���
     * @param {Object} obj �ؼ�����
     */
    AForm.registerValidator = function(name, obj) {
        AForm.Plugin.validator[name] = obj;
    };

    /**
     * @description ע��������
     * @param {String} name  �ؼ���
     * @param {Object} obj �ؼ�����
     */
    AForm.registerAdapter = function(name, obj) {
        AForm.Plugin.adapter[name] = obj;
    };

    //������֤����
    function genValProp(name, v, fd, vfn, errorMsg) {
        var tag = "_af_prop_" + name;

		if(_h.getObjType(fd.validators) !== "Array")return;
        _h.removeArray(fd.validators, function(item) {
            return item._af_source = tag;
        });
        delete fd.ctrlAttr[name];
        if (v) {
            fd.ctrlAttr[name] = v;
            (fd.validators.push({
                    rule: vfn,
                    _af_source: tag,
                    errorMsg: errorMsg
                }
            ));
        }
    }

    //�������Ե�ע��
    AForm.registerProp("maxlength", {
        beforeRender: function(propValue, propName, conf) {
            genValProp(propName, propValue, conf, function(v) {
                return v.length <= propValue;
            }, "������ַ������費����" + propValue)
        }
    });
    AForm.registerProp("max", {
        beforeRender: function(propValue, propName, conf) {
            genValProp(propName, propValue, conf, function(v) {
                return v - 0 <= propValue - 0;
            }, "�����ֵ�費����" + propValue)
        }
    });
    AForm.registerProp("min", {
        beforeRender: function(propValue, propName, conf) {
            genValProp(propName, propValue, conf, function(v) {
                return v - 0 >= propValue - 0;
            }, "�����ֵ�費С��" + propValue)
        }
    });
    AForm.registerProp("minlength", {
        beforeRender: function(propValue, propName, conf) {
            genValProp(propName, propValue, conf, function(v) {
                return v.length >= propValue;
            }, "������ַ������費����" + propValue)
        }
    });
    AForm.registerProp("readonly disabled pattern", {
        beforeRender: function(r, prop, conf) {
            if (r) {
                conf.ctrlAttr[prop] = r;
            } else {
                delete conf.ctrlAttr[prop];
            }
        }
    });
    AForm.registerProp("size title placeholder", {
        beforeRender: function(s, prop, conf) {
            conf.ctrlAttr[prop] = s;
        }
    });
    AForm.registerProp("multiple", {
        beforeRender: function(multiple, prop, conf) {
            (multiple && conf.type == "select") && (conf.ctrlAttr["multiple"] = "multiple");
        }
    });
    AForm.registerProp("required", {
        beforeRender: function(required, prop, conf) {
            required && (conf.ctrlAttr["required"] = "required");
        }
    });

    /* ע�������Ⱦ�� */
    AForm.registerControl(AFORM_HTML_INPUT, {
        desc: "AForm ������Ⱦ��",
        render: function(nameOrIndex, input, fieldConfig, renderCount, afObj, jpath, hideLabel) {
            return _FormElementFactory.generateInputHtml(nameOrIndex, input, fieldConfig, afObj);
        },
        getJsonPartString: function(domEle, fd, af) {
            var controlList = _h.getInput(domEle, af.config.restrict);
            //����Ȼ�޿ؼ����򷵻ؿ�json
            if (controlList.length == 0) {
                return "\"\":null";
            }

            var l = controlList.length;
            var fieldName = controlList[0].name;
            var jpath = controlList[0].getAttribute("jpath") || domEle.getAttribute("jpath");
            var conf = af.getConfigByPath(jpath);
            var result = [];

            if (fieldName)//�������ֶ���������Ϊkey
            {
                result.push("\"" + fieldName + "\":");
            }

            //��ȡ���ֶε�value
            var values = [];
            for (var i = 0; i < l; i++) {
                var input = controlList[i];
                var domType = input.type;
                if (domType == "radio" || domType == "checkbox") {
                    if (!input.checked) {
                        continue;
                    }//δ��ѡ�������֮��������һ��input
                }

                if (domType == "select-multiple") {
                    var select = input;
                    var selen = select.length;
                    for (j = 0; j < selen; j++) {
                        if (select.options[j].selected) {
                            values.push(select.options[j].value);
                        }
                    }
                }
                else//�ı������radio��checobox��
                {
                    if (conf.needOther) {//��������otherѡ��
                        if (_h.hasClass(input, "aform-other-input")) {//��ѡ����other
                            if (values[values.length - 1] == "__other__") {
                                values[values.length - 1] = (_h.trim(input.value));
                            }
                        } else {
                            values.push(_h.trim(input.value));
                        }
                    } else {
                        values.push(_h.trim(input.value));
                    }
                }
            }

            //����Ϊ������
            var tmpValue = values.join('');
            validateInput(af, input, tmpValue, conf, controlList[0]);

            //ֵ����������
            var fnAdpt = function(v) {
                return v;
            };
            if (conf.valueAdapter && typeof conf.valueAdapter.beforeGet == "function") {
                fnAdpt = conf.valueAdapter.beforeGet;
            }

            //�Ѵ�����ֵ����result
            if (domEle.className.indexOf("json-Boolean") > -1) {
                var tmp = fnAdpt(values.length > 0);
                if (typeof tmp == "string") {
                    tmp = "\"" + tmp + "\"";
                }
                result.push(tmp);//����ѡ��Ϊtrue
            }
            else if (domEle.className.indexOf("json-Number") > -1) {
                var len = values.length;
                for (var i = 0; i < len; i++) {
                    values[i] -= 0;//ת��Ϊ����
                }
                result.push(fnAdpt(values.join(conf.delimiter || ',')));
            }
            else {// (domEle.className.indexOf("json-String") > -1) {
                var len = values.length;
                for (var i = 0; i < len; i++) {
                    //���˲��Ϸ���bad control char
                    values[i] = _replaceBadControl(values[i]);
                }

                result.push('"');
                result.push(fnAdpt(values.join(conf.delimiter || ",")));
                result.push('"');
            }

            return result.join("");
        }
    });
    htmlInputControl = new AForm.Plugin.control[AFORM_HTML_INPUT];

    /* ע�������Ⱦ�� */
    AForm.registerControl(AFORM_BASIC_PLUGIN, AFORM_HTML_INPUT, {
        desc: "AForm ������Ⱦ��",
        render: function(nameOrIndex, input, fieldConfig, renderCount, afObj, jpath, hideLabel) {
            if (fieldConfig.jtype == "Number") {
                return _FormElementFactory.createNumber(input, nameOrIndex, afObj.config, fieldConfig, hideLabel, afObj);
            } else if (fieldConfig.jtype == "String") {
                return _FormElementFactory.createString(input, nameOrIndex, afObj.config, fieldConfig, hideLabel, afObj);
            } else if (fieldConfig.jtype == "Boolean") {
                return _FormElementFactory.createBoolean(input, nameOrIndex, afObj.config, fieldConfig, hideLabel, afObj);
            } else {
                return _FormElementFactory.createString(input, nameOrIndex, afObj.config, fieldConfig, hideLabel, afObj);
            }
        }
    });
    basicControl = new AForm.Plugin.control[AFORM_BASIC_PLUGIN];

    //ע��������Ԫ����Ⱦ��
    AForm.registerControl(AFORM_ARR_ROW_PLUGIN, {
            desc: "AForm arr��Ⱦ��",
            render: function(i, input, fieldConfig, renderCount, afObj, jpath, hideLabel) {
                var temp = [];
                var curEle = input;
                var isRegular = _h.getObjType(input) == "Object";//����һ��Ԫ����Object���򵱳�Ԫ����ͳһ����Ĺ�������

                var eleType = _formHelper.getObjType(curEle);
                var basicClass = _formHelper.isInArray(eleType, ['String', 'Number', 'Boolean']) ?
                    " json-basic-element" : "";
                temp.push("<tr jpath='" + jpath + "[" + i + "]' class='" + basicClass + "json-" + eleType + "'>");
                var attrIndexDisplay = fieldConfig.showArrayNO ? "" : "display:none";

                if (isRegular) {
                    temp.push("<td style='" + attrIndexDisplay + "' class='json-form-rowNumber'>" + (i + 1) + "</td>");
                    //���ֶ�����
                    var keyArray = _sortObject(curEle, fieldConfig.fields);
                    //�����ź�����ֶ�
                    for (var ii = 0; ii < keyArray.length; ii++) {
                        var p = keyArray[ii];
                        var fieldConf = afObj.getConfigByPath(jpath + "[0]." + p);
                        if (fieldConf.noRender) {
                            continue;
                        }
                        temp.push("<td");
                        if (fieldConf.hidden) {
                            temp.push(" style='display:none'");
                        }
                        temp.push(">");
                        temp.push(afObj.renderData(curEle[p], p, jpath + "[" + i + "]." + p, true));//����label��tips

                        temp.push("</td>");
                    }
                }
                else {
                    temp.push("<td class='json-form-rowNumber'>" + (i + 1) + "</td><td>");
                    temp.push(afObj.renderData(curEle, i, jpath + "[" + i + "]"));

                    temp.push("</td>");
                }

                //ĩβ�Ĳ�����
                if (!_formHelper.isObjEmpty(fieldConfig.rowAction)) {
                    temp.push("<td class='json-form-actionCell'>");

                    for (var cmd in fieldConfig.rowAction) {
                        var btn = fieldConfig.rowAction[cmd];
                        temp.push("<span class='json-form-action-wrapper' cmd='" + cmd + "'>");
                        temp.push(btn.html.replace(/<(\w)+\s*/g, "<$1 cmd='" + cmd + "' "));
                        temp.push("</span>");
                    }
                    temp.push("</td>");
                }
                temp.push("</tr>");

                return temp.join("");
            }
        }
    );
    rowControl = new AForm.Plugin.control[AFORM_ARR_ROW_PLUGIN];

    //ע��������Ⱦ��
    AForm.registerControl(AFORM_ARR_PLUGIN, {
        desc: "AForm arr��Ⱦ��",
        render: function(nameOrIndex, input, fieldConfig, renderCount, afObj, jpath, hideLabel) {
            fieldConfig.rowAction = fieldConfig.rowAction || afObj.config.rowAction;
            if (typeof nameOrIndex == "string") {
                fieldConfig.attr["name"] = nameOrIndex;
            }

            //��������������
            if (fieldConfig.type in AForm.Plugin.control) {
                //����ù̶���ʽ����
                return _genPlugin(nameOrIndex, input, afObj, fieldConfig.type, fieldConfig, "", "div");
            }

            var tbId = fieldConfig.ctrlId || ("ele_json_tb_" + AForm.renderCount);
            var me = afObj;
            _eventSetter["click"][tbId] = function(e) {
                _formHelper.exeCmd(e, tbId, fieldConfig.rowAction, me.eventArr.beforeExeCmd, me.eventArr.afterExeCmd, afObj);
            };

            var cssText = fieldConfig.cssText;
            if (fieldConfig.hidden) {
                cssText += ";display:none";
            }
            var temp = [];
            temp.push(_s(fieldConfig.frontalHtml));

            temp.push("<table jpath='" + jpath + "' id='" + tbId + "' " + _formHelper.obj2str(fieldConfig.attr) +
                " style=\"" +
                cssText + "\" class=\"json-form-element json-Array " + AForm.Config.extClassName.table +
                "\">");
            temp.push("<caption style='display:" + (fieldConfig.hideLabel ? "none" : "") + "'>");
            temp.push("<label cmd='aform_array_collapse_table' ");
            if (!fieldConfig.hideCollapser)//���������۵�������չʾ
            {
                temp.push(" class='json-form-collapser " +
                    (fieldConfig.collapse ? "json-form-ctrl-collapse" : "json-form-ctrl-un-collapse") + "'");
            }
            temp.push(">" + _FormElementFactory.getLabelText(fieldConfig, nameOrIndex) + "</label>");

            if (!fieldConfig.noCreate)//��û��ֹ���
            {
                var addRowText = afObj.config.addRowText || "��";
                temp.push(" <a cmd='aform_array_add_row' style='display:" + (fieldConfig.collapse ? "none" : "") +
                    "' class='json-form-array-add' href='javascript:void(null)'  title='����һ��'>" + addRowText + "</a> ");
            }

            if (fieldConfig.tips && !fieldConfig.noTips) {
                temp.push(fieldConfig.tipsTpl.replace(/\{tips\}/g, fieldConfig.tips));
            }
            temp.push("</caption>");

            var len = input.length;

            //����Ԫ����objectʱ���ӱ�������
            //����������0������Ԫ�����룬����ȡ����
            //�����ֶ�ʱ�����ߵ�һ��Ԫ��ʱ����ʱ��˵������Ԫ����object�������ɱ�ͷ
            var isRegular = (!_h.isObjEmpty(fieldConfig.fields)) || (len > 0 && input[0].constructor == Object);//����һ��Ԫ����Object���򵱳�Ԫ����ͳһ����Ĺ�������
            var attrIndexDisplay = fieldConfig.showArrayNO ? "" : "display:none";

            if (fieldConfig.noDelete) {
                delete fieldConfig.rowAction["aform_array_delete_row"];
            }
            if (fieldConfig.noCreate) {
                delete fieldConfig.rowAction["aform_array_add_row"];
            }

            //������Ԫ��Ϊ������û���ر�ͷʱ�����ɱ�ͷ
            if (isRegular) {
                temp.push("<thead style='display:" + (fieldConfig.collapse || fieldConfig.hideHeader ? "none" : "") +
                    "'><tr class='aform-array-header'>");
                temp.push("<th style='" + attrIndexDisplay + "'>" + AForm.Config.wording.numText + "</th>");
                var firstEle = _genDefaultData(fieldConfig.fields);

                //���ֶ�����
                var keyArray = _sortObject(firstEle, fieldConfig.fields);
                //�����ź�����ֶ�
                for (var i = 0; i < keyArray.length; i++) {
                    var k = keyArray[i];
                    var fieldConf = afObj.getConfigByPath(jpath + "[0]." + k);
                    if (fieldConf.noRender) {
                        continue;
                    }
                    temp.push("<th");
                    if (fieldConf.hidden) {
                        temp.push(" style='display:none'");
                    }
                    if (fieldConf.required) {
                        temp.push(" class='json-form-required'");
                    }
                    temp.push(">");
                    temp.push(_FormElementFactory.getLabelText(fieldConf, k));
                    if (fieldConf && fieldConf.tips) {
                        var tipsTpl = afObj.config.thTipsTpl;//��ͷ����ʾ
                        temp.push(tipsTpl.replace(/\{tips\}/g, fieldConf.tips));
                    }
                    temp.push("</th>");
                }

                //��������Ϊ����0������������
                if (!_formHelper.isObjEmpty(fieldConfig.rowAction)) {
                    temp.push("<th class='json-form-action'>" + AForm.Config.wording.oprText + "</th>");
                }
                temp.push("</tr></thead>");
            }

            temp.push("<tbody style='display:" + (fieldConfig.collapse ? "none" : "") + "'>");
            //���ɱ�����
            for (var i = 0; i < len; i++) {
                temp.push(rowControl.render(i, input[i], fieldConfig, renderCount, afObj, jpath));
            }

            temp.push("</tbody>");
            temp.push("</table>");
            temp.push(_s(fieldConfig.extHtml));

            return temp.join('');
        }
    });
    arrControl = new AForm.Plugin.control[AFORM_ARR_PLUGIN];

    //ע��OBJ��Ⱦ��
    AForm.registerControl(AFORM_OBJ_PLUGIN, {
        desc: "AForm OBJ��Ⱦ��",
        render: function(nameOrIndex, input, fieldConfig, renderCount, afObj, jpath) {
            if (typeof nameOrIndex == "string") {
                fieldConfig.attr["name"] = nameOrIndex;
            }

            var cssText = (fieldConfig.cssText || "");

            if (fieldConfig.inline) {
                cssText += ";display:inline-block;*display:inline;*zoom:1";//* ie 6��7 hack
            }
            if (fieldConfig.hidden) {
                cssText += ";display:none";
            }
            if (fieldConfig.width) {
                cssText += ";width:" + fieldConfig.width;
            }

            if (fieldConfig.type in AForm.Plugin.control) {
                //����ù̶���ʽ����
                return _genPlugin(nameOrIndex, input, afObj, fieldConfig.type, fieldConfig, cssText, "div");
            }

            if (!nameOrIndex) {
                //fieldConfig.hideCollapser = true;//���Ǹ��ڵ㣬�������۵���
                cssText += "border:none";//���Ǹ��ڵ㣬�����ر߿�
            }

            var fieldsetBegin = ("<" + AForm.Config.tags.objectContainer + " " + _formHelper.obj2str(fieldConfig.attr) +
                " style='" + cssText + "' class='json-form-element json-Object' jpath='" + jpath + "'>");
            var labelCssText = fieldConfig.labelCssText || "";
            labelCssText += ";display:" + (fieldConfig.hideLabel ? "none" : "");
            fieldsetBegin += "<legend style=\"" + labelCssText + "\">";
            fieldsetBegin += "<label  cmd='aform_array_collapse_fieldset' class='json-form-collapser ";
            if (!fieldConfig.hideCollapser)//���������۵�������չʾ
            {
                var colId = "json_form_collapser_" + AForm.renderCount;
                fieldsetBegin +=
                    (fieldConfig.collapse ? "json-form-ctrl-collapse" : "json-form-ctrl-un-collapse") + "'";
                fieldsetBegin += "id='" + colId + "' >";
                _eventSetter["click"][colId] = function(e) {
                    _formHelper.exeCmd(e);
                };
            } else {
                fieldsetBegin += "' >";
            }
            fieldsetBegin += _FormElementFactory.getLabelText(fieldConfig, nameOrIndex);
            fieldsetBegin += "</label>";
            if (fieldConfig.tips && !fieldConfig.noTips) {
                fieldsetBegin += _genTips(fieldConfig.tipsTpl, fieldConfig)
            }

            fieldsetBegin += "</legend>";
            fieldsetBegin += _s(fieldConfig.frontalHtml);
            fieldsetBegin +=
                "<div class='json-form-fdset' style='display:" + (fieldConfig.collapse ? "none" : "") + "'>";//�۵�����
            var fieldsetEnd = "</div></" + AForm.Config.tags.objectContainer + ">";

            var temp = [fieldsetBegin];

            //���ֶ�����
            var keyArray = _sortObject(input, fieldConfig.fields || {});
            //�����ź�����ֶ�
            for (var i = 0; i < keyArray.length; i++) {
                var key = keyArray[i];
                temp.push(afObj.renderData(input[key], key, jpath + "." + key));

            }
            temp.push(_s(fieldConfig.extHtml));
            temp.push(fieldsetEnd);

            return temp.join('');
        }
    });
    objControl = new AForm.Plugin.control[AFORM_OBJ_PLUGIN];

    //Ĭ��ȫ����Ⱦ��
    AForm.registerControl(AFORM_SYS_PLUGIN, {
        desc: "AFormȫ����Ⱦ��",
        render: function(nameOrIndex, input, fieldConfig, renderCount, afObj, jpath, hideLabel) {
            var t = _formHelper.getObjType(input);
            var guid = _guid(renderCount);
            var render;
            switch (t) {
                case "Number":
                case "String":
                case "Boolean":
                    fieldConfig.jtype = t;
                    render = basicControl;
                    break;
                case "Object":
                    render = objControl;
                    break;
                case "Array":
                    render = arrControl;
                    break;
            }

            render.guid = guid;
            return render.render(nameOrIndex, input, fieldConfig, AForm.renderCount, afObj, jpath, hideLabel);
        }
    });
    sysControl = new AForm.Plugin.control[AFORM_SYS_PLUGIN];

    var _valueSetter = {};//dom value��ֵ���У���������Ϊһ��render���̣�ÿ��renderǰҪresetΪ�ն���
    var _eventSetter = {
        click: {},
        blur: {}
    };//�¼���ֵ���У���������Ϊһ��render���̣�ÿ��renderǰҪresetΪ�ն���

    //��Ԫ�ع���
    var _FormElementFactory = {
        //��ȡ�ֶεı�ǩ��
        getLabelText: function(fieldConfig, nameOrIndex) {
            if (fieldConfig && fieldConfig.label) {
                return fieldConfig.label.toString();
            }
            else {
                return typeof nameOrIndex == "undefined" ? "" : nameOrIndex;
            }
        },
        generateDatalist: function(list, id) {
            var len = list.length;

            var html = [];
            html.push("<datalist id='" + id + "'>");

            var isTextValue = len > 0 && typeof list[0] == 'object';

            for (var i = 0; i < len; i++) {
                var v = isTextValue ? list[i].value : list[i];
                var t = isTextValue ? list[i].text : list[i];
                html.push("<option label=\"" + _s(t) + "\" value=\"" + _s(v) + "\" />");
            }

            html.push("</datalist>");
            return html.join('');
        },
        generateInputHtml: function(nameOrIndex, value, fd, afObj) {
            fd = fd || {};
            fd.type = fd.type || "text";
            var attrName = (typeof nameOrIndex == "string" ? ("name=" + nameOrIndex + "") : "");
            var elementId = fd.ctrlId || ("ele_json_" + AForm.renderCount);

            //��������
            var attrHtml = [];
            if (fd.ctrlAttr) {
                attrHtml.push(_formHelper.obj2str(fd.ctrlAttr, " "));
            }
            if (fd.ctrlCssText) {
                attrHtml.push("style='" + fd.ctrlCssText + "'");
            }

            attrHtml.push("class='json-field-input " + AForm.Config.extClassName.control + " " +
                _s(fd.type) + "'");
            attrHtml = attrHtml.join(" ");
            //end ��������

            var sDisabled = fd.disabled ? "disabled" : "";

            var html = [];

            if (fd.jtype == "Boolean") {
                html.push("<input " + attrHtml + " id=\"" + elementId + "\" type=\"checkbox\" " +
                    (value ? "checked" : "") + " " + attrName + " />");
            } else {
                switch (fd.type) {
                    case "text":
                    default:

                        var listHtml = "";
                        var listId = "list_" + elementId;

                        html.push("<input data-gen='aform' ");
                        if (fd.datalist && fd.datalist.length > 0) {
                            listHtml = (this.generateDatalist(fd.datalist, listId));
                            html.push(" list='" + listId + "'");
                        }
                        html.push(attrHtml);
                        html.push(" id='");
                        html.push(elementId + "' type='" + fd.type + "' ");//�������û������type��������text��������֧��html5������
                        html.push(attrName);
                        html.push(" value=\"" + "" + "\" />");

                        _eventSetter["blur"][elementId] = function(e) {
                            var ip = _h.getTarget(e);
                            _formHelper.validateInput(ip, fd, afObj);
                        };
                        //param.value == 0������£��᲻��ʾ0
                        (value === undefined || value === null) && (value = "");
                        value !== "" && (_valueSetter[elementId] = value);//ʹ��dom��ֵ������ʹ���ַ���ƴ�ӷ�ʽ�����ⵥ���š�˫���ŵ��ַ�ת�������
                        html.push(listHtml);

                        break;
                    case "textarea":

                        html.push("<textarea data-gen='aform' ");
                        html.push(attrHtml);
                        html.push(" id='");
                        html.push(elementId + "'");
                        html.push(attrName);
                        html.push(">" + value + "</textarea>");

                        _eventSetter["blur"][elementId] = function(e) {
                            var ip = _h.getTarget(e);
                            _formHelper.validateInput(ip, fd, afObj);
                        };

                        break;
                    case "hidden":

                        html.push("<input data-gen='aform' type='hidden' ");
                        html.push(attrHtml);
                        html.push(" id='");
                        html.push(elementId + "'");
                        html.push(attrName);
                        html.push(" value=\"" + value + "\" />");

                        break;
                    case "select":

                        html.push("<select data-gen='aform' ");
                        html.push(attrHtml);
                        html.push(" id='" + elementId + "' ");
                        html.push(attrName);
                        html.push(">");

                        _eventSetter["blur"][elementId] = function(e) {
                            var ip = _h.getTarget(e);
                            _formHelper.validateInput(ip, fd, afObj);
                        };

                        var list = fd.datalist || [];
                        var len = list.length;

                        var valueArr = fd.multiple ?
                            value.toString().split(fd.delimiter || AForm.Config.defaultDelimiter) : [value];

                        for (var i = 0; i < len; i++) {
                            var v = list[i].value == undefined ? list[i] : list[i].value;
                            var t = list[i].text == undefined ? list[i] : list[i].text;

                            if (list[i].group) {
                                html.push("<optgroup label='" + t + "'></optgroup>");
                            }
                            else {
                                html.push("<option " +
                                    (_formHelper.isInArray(v.toString(), valueArr) ? "selected" : "") +
                                    " value=\"" + v + "\">" + t + "</option>");
                            }
                        }

                        html.push("</select>");
                        break;
                    case "radio":

                        html.push("<span ");
                        html.push(attrHtml);
                        html.push(" id='" + elementId + "' ");
                        html.push(">");

                        var list = fd.datalist;
                        var len = list.length;
                        var isTextValue = len > 0 && typeof list[0] == 'object';
                        var hasChecked = false;//�Ƿ�radio��ѡ��

                        for (var i = 0; i < len; i++) {
                            var v = isTextValue ? list[i].value : list[i];
                            v = _s(v);
                            var t = isTextValue ? list[i].text : list[i];
                            if (v == value) {
                                hasChecked = true;
                            }
                            html.push("<label><input jpath='" + fd.jpath + "' data-gen='aform' " + attrName + " " +
                                sDisabled +
                                " type='radio' " + (v == value ? "checked" : "") + " value=\"" + v +
                                "\" />" + t + "</label>");
                        }
                        if (fd.needOther) {
                            var needChecked = !hasChecked && value;//��valueδ��ѡ�У��Ҳ�Ϊ��
                            html.push("<label><input jpath='" + fd.jpath +
                                "' class=\"aform-other-radio\" data-gen='aform' " + attrName + " " +
                                sDisabled +
                                " type='radio' " + (needChecked ? "checked" : "") +
                                " value=\"__other__\" />����</label>");
                            html.push("<label><input jpath='" + fd.jpath + "' class=\"aform-other-input " +
                                AForm.Config.extClassName.control +
                                "\" data-gen='aform' " + attrName + " " + sDisabled +
                                " type='text'  value=\"" + (hasChecked ? "" : value) + "\" /></label>");
                        }

                        html.push("</span>");

                        break;
                    case "checkbox":

                        html.push("<span ");
                        html.push(attrHtml);
                        html.push(" id='" + elementId + "' ");
                        html.push(">");

                        var list = fd.datalist || [];
                        var len = list.length;

                        var valueArr = value.toString().split(fd.delimiter || AForm.Config.defaultDelimiter);

                        for (var i = 0; i < len; i++) {
                            var isO = typeof list[i] == 'object';

                            var v = isO ? list[i].value : list[i];
                            var t = isO ? list[i].text : list[i];
                            var c = isO ? list[i].custom : "";
                            html.push("<label><input jpath='" + fd.jpath + "' data-gen='aform' " + attrName + " " +
                                sDisabled +
                                " type='checkbox' " + (_formHelper.isInArray(_s(v), valueArr) ? "checked" : "") +
                                " value=\"" + _s(v) + "\" data-custom=\"" + _s(c) + "\" /> " + _s(t) + "</label>");
                        }

                        html.push("</span>");

                        break;
                }
            }

            return html.join('');
        },
        //��������ؼ�
        createInputRow: function(param) {
            if (!param.fieldConfig) {
                param.fieldConfig = {};
            }

            var strAttrName = (typeof param.nameOrIndex == "string" ? ("name=" + param.nameOrIndex + "") : "");
            var elementId = param.fieldConfig.ctrlId || ("ele_json_" + AForm.renderCount);

            var labelHtml = "<" + AForm.Config.tags.label + " class='json-field-label " +
                AForm.Config.extClassName.label + " label_" + param.nameOrIndex + "' style='" +
                (param.fieldConfig.labelCssText || "") + ";display:" +
                ((strAttrName == "" || param.hideLabel || param.fieldConfig.hideLabel) ? "none" : "") + "' for='" +
                elementId + "'>";
            if (param.fieldConfig.required && param.globalConfig.requireAtBegin) {
                labelHtml += "<span class='json-form-required'>*</span>";
            }
            labelHtml += this.getLabelText(param.fieldConfig, param.nameOrIndex);
            labelHtml += param.fieldConfig.hideColon ? "" : AForm.Config.wording.labelColon;
            if (param.fieldConfig.required && !param.globalConfig.requireAtBegin) {
                labelHtml += " <span class='json-form-required'>*</span>";
            }
            labelHtml += "</" + AForm.Config.tags.label + ">";

            var cssText = (param.fieldConfig.cssText || "");
            var attr = _h.extend({}, param.fieldConfig.attr);
            var className = "json-form-element json-basic-element json-" + param.dataType + " " +
                AForm.Config.extClassName.basicContainer;

            if (param.fieldConfig.inline) {
                cssText += ";display:inline-block;*display:inline;*zoom:1";//* ie 6��7 hack
                className += " json-form-inline";
            }
            if (param.fieldConfig.hidden) {
                attr.hidden = 'hidden';
                cssText += ";display:none";
            }
            if (param.fieldConfig.jpath) {
                attr["jpath"] = param.fieldConfig.jpath;
            }
            if (param.fieldConfig.width) {
                cssText += ";width:" + param.fieldConfig.width;
            }

            var html = ["<" + AForm.Config.tags.basicContainer + " " + _formHelper.obj2str(attr) + " style='" +
                cssText + "' class='" + className + "'>"];
            html.push(labelHtml);

            if (param.fieldConfig.frontalHtml)//����ؼ�ǰ��html
            {
                html.push(param.fieldConfig.frontalHtml);
            }

            //���ж��Ƿ��в���������ò���й���Ⱦ
            if (param.fieldConfig.type in AForm.Plugin.control) {
                //����ù̶���ʽ����
                html.push(_genPlugin(param.nameOrIndex, param.inputData, param.afObj, param.fieldConfig.type, param.fieldConfig));
            }
            else {
                if (AForm.Config.tags.controlContainer) {
                    html.push("<" + AForm.Config.tags.controlContainer + " class='" +
                        (AForm.Config.extClassName.controlContainer || '') + "'>");
                }
                html.push(htmlInputControl.render(param.nameOrIndex, param.inputData, param.fieldConfig, AForm.renderCount, param.afObj));
                if (AForm.Config.tags.controlContainer) {
                    html.push("</" + AForm.Config.tags.controlContainer + ">");
                }

                if (param.fieldConfig.type) {
                    //_debug(param.fieldConfig.type + " not exist");
                }
            }

            if (param.fieldConfig.extHtml)//����html
            {
                html.push(param.fieldConfig.extHtml);
            }
            if (!param.fieldConfig.noTips && param.fieldConfig.tips)//��δ���ذ���tips����tips��Ϊ��
            {
                var tipsTpl = param.fieldConfig.tipsTpl || param.globalConfig.tipsTpl;//�ֶ�����
                html.push(_genTips(tipsTpl, param.fieldConfig));
            }
            html.push("</" + AForm.Config.tags.basicContainer + ">");

            if (param.fieldConfig["break"]) {
                html.push('<br style="clear:both">');
            }
            return html.join('');
        },
        createString: function(inputStr, nameOrIndex, globalConfig, fieldConfig, hideLabel, afObj) {
            return this.createInputRow({
                inputData: inputStr,
                dataType: "String",
                nameOrIndex: nameOrIndex,
                globalConfig: globalConfig,
                fieldConfig: fieldConfig,
                hideLabel: hideLabel,
                afObj: afObj
            });
        },
        createNumber: function(inputNumber, nameOrIndex, globalConfig, fieldConfig, hideLabel, afObj) {
            return this.createInputRow({
                inputData: inputNumber,
                dataType: "Number",
                nameOrIndex: nameOrIndex,
                globalConfig: globalConfig,
                fieldConfig: fieldConfig,
                hideLabel: hideLabel,
                afObj: afObj
            });
        },
        createBoolean: function(inputBool, nameOrIndex, globalConfig, fieldConfig, hideLabel, afObj) {
            return this.createInputRow({
                inputData: inputBool,
                dataType: "Boolean",
                nameOrIndex: nameOrIndex,
                globalConfig: globalConfig,
                fieldConfig: fieldConfig,
                hideLabel: hideLabel,
                afObj: afObj
            });
        }
    };

    /**
     * @description aform���캯��
     * @param {String or Object} container  ��������domId����dom�ڵ�
     * @param {Object} config �ؼ�����
     */
    function AForm(container, config) {
        this.container = typeof container == "string" ? _formHelper.$(container) : container;
        if (!this.container) {
            _debug("no container");
            return false;
        }

        AForm.formCount++;
        if (!this.container.id) {
            this.container.id = "aform_" + AForm.formCount + "_" + parseInt(Math.random() * 10000);
        }
        aformInstance[this.container.id] = this;
        this.eventArr = {
            "beforeRender": [],
            "renderComplete": [],//��Ⱦ��� �Ļص����У�����ͨ��on('renderComplete',function) ����ص�����
            "enter": [],
            "change": [],//�����������޸�ʱ
            "beforeExeCmd": [],
            "afterExeCmd": [],
            "valid": [],//�ֶ�ͨ��У��ʱ
            "invalid": [],//�ֶ�δͨ��У��ʱ
            "globalInvalid": [],//����������δͨ��У��ʱ
            "empty": [] //�ֶα��Ϊ��ʱ
        };
        this.errors = [];//�Ƿ��ȡ����ʱ���ڴ���

        //��ʼ��Ĭ������
        this.config = {
            title: "", //���ı���
            //ʹ��schema��ģʽ
            // remote - ����render�����е����ݲ����Զ�����
            // local - ��ȫ�û����壬��fields����
            // merge - ��user�����schema�ϲ����������ɵ�schema���༴��schema�С�data�޵��ֶΣ��ϲ�����и��ֶ�
            schemaMode: "remote",//Ĭ����remote���༴����data�Զ�����
            showArrayNO: true,//�Ƿ���ʾ����Ԫ����ţ���1��ʼ
            hideCollapser: false,//�����۵���
            restrict: false,//�Ƿ��ϸ�ģʽ
            className: "",//������ʽ��,
            lazyRenderInterval: 50,//�ӳ���Ⱦ�ļ��
            requireAtBegin: false,//�����Ǻ��Ƿ���label��ǰ��
            validators: false,//ȫ����֤��
            noValidate: false,//Ĭ�Ͽ�����֤
            breakOnError: true,//�������ֶγ���ʱ���жϳ���ִ����
            readonly: false,//ֻ��ģʽ����Ϊtrue����Ĭ���������пؼ���Ϊֻ��
            hideColon: false,//������ð��
            addRowText: AForm.Config.wording.addRowText,
            rowAction: AForm.Config.defaultAction,
            tipsTpl: AForm.Config.tpl.tips,
            thTipsTpl: AForm.Config.tpl.thTips,
            fields: {}				//�ֶ����ã��ֶ���Ϊkey
        };

        //�ϲ�������
        if (typeof config == "object") {
            for (var p in config) {
                //�¼�������
                if (p.substr(0, 2) == "on" && typeof config[p] == "function") {
                    var ep = p.replace(/^on([A-Z])/, function(all, $1) {
                        return $1.toLowerCase()
                    });
                    if (ep in this.eventArr) {
                        this.on(ep, config[p]);
                    }
                }
                else {
                    this.config[p] = config[p];
                }
            }
        }

        _h.addClass(this.container, "aform");
        _h.addClass(this.container, this.config.className);

        this.config.watch = _computeWatch(this.config.watch);
        this.config.validators = _computeValidator(this.config.validators);
        this.config.valueAdapter = _computeAdapter(this.config.valueAdapter);

        //��ʼ���¼�
        for (var evt in validateEvt) {
            this.on(evt, validateEvt[evt]);
        }

        this.on("empty", function(input, conf) {
            this.errors.push({
                "errorType": "empty",
                "errorMsg": "������" + conf.label,
                "invalidControl": input
            });
        });
        this.on("invalid", function(input, conf, errorMsg) {
            this.errors.push({
                "errorType": "invalid",
                "errorMsg": errorMsg,
                "invalidControl": input
            });
        });
        this.on("globalInvalid", function(msg, input) {
            this.errors.push({
                "errorType": "globalInvalid",
                "errorMsg": msg,
                "invalidControl": input
            });
        });

        //æָʾ��
        this.busy = 0;

        //ֵ������
        this.on("change", function(jpath, cv, input) {
            _debug(jpath + " changed to : " + cv);
            var obs = this.config.watch[jpath];
            if (!obs) {
                return;
            }
            if (_h.getObjType(obs) != "Array") {
                _debug("watch of " + jpath + " is not array");
                return;
            }

            _h.each(obs, function(fn) {
                fn(cv, input);
            })
        });
        var me = this;
        this.on("beforeRender", function() {
            _valueSetter = {};//��Ⱦǰreset
            _eventSetter = {
                click: {},
                blur: {}
            };
        });
        this.on("renderComplete", function() {
            //��ֵ��
            for (var id in _valueSetter) {
                if (id && _formHelper.$(id)) {
                    _formHelper.$(id).value = _valueSetter[id];
                }
            }
            //�¼���ֵ��
            _h.objEach(_eventSetter, function(evtName, idObj) {
                _h.objEach(idObj, function(id, fn) {
                    _h.addEvent(_h.$(id), evtName, fn);
                });
            });
        });
        this.one("renderComplete", function() {
            //���ü�����
            var d = this.originData;
            for (var jp in this.config.watch) {
                var cv = eval("(d" + jp + ")");
                this.emit("change", [jp , cv]);
            }

            attachMonitor(this.container, function(jpath, cv, input) {
                me.emit("change", [jpath , cv , input]);
            });

            //�س��¼�
            _h.addEvent(me.container, "keyup", function(evt) {
                evt = evt || window.event;
                if (evt.keyCode == 13) {
                    me.emit("enter");
                }
            });
        });
    }

    //��һ���¼�
    AForm.prototype.on = function(evtName, handler) {
        if (evtName in this.eventArr) {
            this["eventArr"][evtName].push(handler);
        }
    };

    //���һ���¼�
    AForm.prototype.off = function(evtName, handler) {
        if (evtName in this.eventArr) {
            var me = this;
            var newArr = [];
            _h.each(this["eventArr"][evtName], function(item, i) {
                if (item !== handler) {
                    newArr.push(item);
                }
            });

            this["eventArr"][evtName] = newArr;
        }
    };

    //��һ���¼���ִ�����ȡ����
    AForm.prototype.one = function(evtName, handler) {
        if (evtName in this.eventArr) {
            var me = this;
            var dstFn = function() {
                me.off(evtName, dstFn);
                handler.call(me);
            };
            this["eventArr"][evtName].push(dstFn);
        }
    };

    //����һ���¼�
    AForm.prototype.emit = function(evtName, data) {
        _joinFunction(this.eventArr[evtName], this, data);
        if (evtName in validateEvt && evtName != "valid" && this.config.breakOnError) {
            _debug(data);
            throw new Error("invalid data ,reason is " + evtName);
        }
    };

    //���ã��൱�������һ����Ⱦ���������»��Ʊ��������ȿ�����ϴ���Ⱦ֮���û�����ĺۼ�
    AForm.prototype.reset = function() {
        this.render(this.originData);
    };

    //��Ⱦjson����
    //input �����json����
    AForm.prototype.render = function(input) {
        if (!this.container) {
            return false;
        }

        //��������
        for (var p in this.config.fields) {
            this.config.fields[p].name = p;//����name����
            _computeProp(this.config.fields[p], this);
        }
        var me = this;

        if (this.busy > 0) {
            setTimeout(function() {
                me.render(input);
            }, this.config.lazyRenderInterval);
            _debug("aform is busy,will rerender after some time");
            return this;
        }

        if (input === undefined || input === null) {
            this.config.schemaMode = "local";//���������ݣ���ǿ��ʹ�ñ���schema
            if (this.config.jtype == "Array") {
                input = [
                    {}
                ];
            }
        } else {
            //ȫ������������
            if (this.config.valueAdapter && typeof this.config.valueAdapter.beforeRender == "function") {
                input = this.config.valueAdapter.beforeRender(input);
            }
        }

        switch (this.config.schemaMode) {
            case "local":
                var isArray = _h.getObjType(input) == "Array";
                var localData = _genDefaultData(this.config.fields);
                input = typeof input == "object" ? input : {};

                if (isArray) {
                    var tmpArr = [];
                    for (var i = 0 , len = input.length; i < len; i++) {
                        var tmp = {};

                        for (var p in localData) {
                            tmp[p] = localData[p];//����
                            if (_h.getObjType(input[i]) != "Object") {
                                input[i] = {};
                            }
                            if (p in input[i]) {
                                tmp[p] = input[i][p];
                            }
                        }

                        tmpArr.push(tmp);
                    }
                } else if (!_formHelper.isObjEmpty(input)) {
                    for (var p in localData) {//֧��2�����
                        if (_h.getObjType(localData[p]) == "Object") {
                            for (var pp in localData[p]) {
                                if (_h.getObjType(input[p]) == "Object" && pp in input[p]) {
                                    localData[p][pp] = input[p][pp];
                                }
                            }
                        } else if (_h.getObjType(localData[p]) == "Array") {
                            if (_h.getObjType(input[p]) != "Array") {
                                input[p] = [
                                    {}
                                ];
                            }
                            _h.each(input[p], function(item, i) {
                                localData[p][i] = _h.extend({}, localData[p][0]);
                                for (var pp in localData[p][i]) {
                                    if (_h.getObjType(input[p][i]) == "Object" && pp in input[p][i]) {
                                        localData[p][i][pp] = input[p][i][pp];
                                    }
                                }
                            });
                        } else {
                            if (p in input) {
                                localData[p] = input[p];
                            }
                        }
                    }
                }
                input = isArray ? tmpArr : localData;//���鲻��
            default :
                break;
        }

        this.emit("beforeRender");

        this.originData = input;//���һ����Ⱦ��ԭʼ����
        this.container.innerHTML = this.renderData(this.originData);

        //��Ⱦ����
        var rootEle = this.container.childNodes[0];
        var titleEle = null;
        if (rootEle) {
            if (rootEle.tagName.toLowerCase() == "fieldset") {
                titleEle = rootEle.getElementsByTagName("legend")[0];
            }
            else if (rootEle.tagName.toLowerCase() == "table") {
                titleEle = rootEle.getElementsByTagName("caption")[0].getElementsByTagName("label")[0];
            }
        }

        if (this.config.title)//�������˱��⣬����ʾ����������
        {
            titleEle && (titleEle.innerHTML = this.config.title + " " + titleEle.innerHTML);
        }
        else {
            titleEle && (titleEle.style.display = "none");
        }

        //renderComplete
        this.emit("renderComplete");

        return this;
    };

    //��ȡ����ռ伯�ϵ�value������json
    AForm.prototype.getJson = function(domEle)//��������
    {
        var result = this.getJsonString();
        var d = eval("(" + result + ")");
        //ȫ������������������getJson������Ч
        if (d && this.config.valueAdapter && typeof this.config.valueAdapter.beforeGet == "function") {
            d = this.config.valueAdapter.beforeGet(d);
        }

        return d;
    };

    //��ȡ����ռ伯�ϵ�value������json
    AForm.prototype.tryGetJson = function(domEle)//��������
    {
        var result = null;
        try {
            result = this.getJson();
        }
        catch (ex) {
        }
        finally {
            return result;
        }
    };

    //��ȡ����ռ伯�ϵ�value������json�ַ���
    AForm.prototype.tryGetJsonString = function(domEle)//��������
    {
        var result = null;
        try {
            result = this.getJsonString();
        }
        catch (ex) {
        }
        finally {
            return result;
        }
    };

    //��ȡ����ռ伯�ϵ�value������json
    AForm.prototype.getJsonString = function(domEle)//��������
    {
        var me = this;
        this.errors = [];//reset

        var result = _getJsonString.call(this);
        if (!this.config.noValidate && this.config.validators) {
            var json = eval("(" + result + ")");
            _h.each(this.config.validators, function(item) {
                if (typeof item.rule == "function" && item.rule(json, me.container) !== true &&
                    item.errorMsg !== false) {
                    me.emit("globalInvalid", [item.errorMsg , item.invalidControl]);
                }
            });
        }

        if (this.errors.length > 0) {
            _debug(this.errors);
            throw new Error("get form value has " + this.errors.length + " errors");
        }
        return result;
    };

    //��ȡ����ؼ����ϵ�value����������json���ַ���
    function _getJsonString(domEle)//����
    {
        var me = this;
        domEle = domEle || (this.container ? this.container.childNodes[0] : null);//��δ������Ĭ��Ϊ��Ԫ��
        if (!domEle) {
            return "";
        }
        var result = [];

        if (_h.hasClass(domEle, "json-field-plugin"))//�������
        {
            var guid = domEle.getAttribute("guid");
            var pluginInstance = controlInstance[guid];

            var jpath = domEle.getAttribute("jpath");
            return pluginInstance.getJsonPartString(domEle, this.getConfigByPath(jpath), this);
        }

        var domEleName;
        if (_h.hasClass(domEle, 'json-Object')) {
            domEleName = domEle.getAttribute("name");//ie9��ʹ��getAttribute
            var conf = {};
            if (domEleName) {
                result.push("\"" + domEleName + "\":");
                conf = this.config.fields[domEleName];
            }
            result.push("{");

            var childNodes = [];
            if (domEle.nodeName == 'TR') {
                _formHelper.each(domEle.cells, function(cell) {
                    if (cell.firstChild && cell.firstChild.nodeType == 1 && _h.isFormElement(cell.firstChild)) {
                        childNodes.push(cell.firstChild);
                    }
                });
            }
            else {
                //�ҵ�fdset json-form-fdset
                var divs = domEle.childNodes;
                _h.each(divs, function(ele) {
                    if (ele.tagName == "DIV" && ele.className == "json-form-fdset") {
                        childNodes = ele.childNodes;
                        return false;
                    }
                });
            }

            var realNodes = [];
            _h.each(childNodes, function(node, i) {
                _h.isFormElement(node) && realNodes.push(node);
            });

            var len = realNodes.length;
            for (var i = 0; i < len; i++) {
                var node = realNodes[i];
                result.push(_getJsonString.call(this, node));
                if (i < len - 1) {
                    result.push(",");
                }
            }
            result.push("}");
        }
        else if (_h.hasClass(domEle, 'json-Array')) {
            domEleName = domEle.getAttribute("name");
            if (domEleName) {
                result.push("\"" + domEleName + "\":");
            }
            result.push("[");

            var rows = domEle.tBodies.length > 0 ? domEle.tBodies[0].rows : [];//����thead
            var len = rows.length;
            _h.each(rows, function(row, i) {
                result.push(_getJsonString.call(me, row));
                if (i < len - 1) {
                    result.push(",");
                }
            });
            result.push("]");
        }
        else if (_h.hasClass(domEle, "json-basic-element")) {
            //���Ҳ��
            var nodes = domEle.childNodes;
            var i = nodes.length;
            while (i--) {
                if (_h.hasClass(nodes[i], "json-field-plugin") && !_h.isIgnore(nodes[i])) {
                    var guid = nodes[i].getAttribute("guid");
                    var pluginInstance = controlInstance[guid];

                    var jpath = domEle.getAttribute("jpath");
                    return pluginInstance.getJsonPartString(nodes[i], this.getConfigByPath(jpath), this);
                }
            }

            //û�в���Ļ���ȡֵ
            return basicControl.getJsonPartString(domEle, null, this);
        }

        result = result.join('');
        return  result;
    }

    //����path��ȡ�ֶ�����
    AForm.prototype.getConfigByPath = function(path) {
        path = path || "";
        path = path.replace(/\[.+?\]/g, "");//�滻������ a[0].b[1] �滻Ϊ a.b
        if (!path) {
            return this.config;
        }//��pathΪ�գ�ȡ������

        var arr = path.split('.');
        var conf = this.config || {};

        for (var i = 0, l = arr.length; i < l; i++) {
            var p = arr[i];
            if (!p) {
                continue;
            }
            if (conf && conf.fields) {
                conf = conf.fields[p];
            } else {
                conf = null;
            }
        }

        //����޸�·����������Ϊ�Զ�����schema�����õ�һ����ֶ���Ϊ����
        if (_formHelper.isObjEmpty(conf) && (this.config.schemaMode == "remote" || !this.config.schemaMode)) {
            conf = this.config.fields[p];
        }

        return conf || {};
    };

    //������Ⱦĳ������
    //@jpath ��ǰ���ݵ�·������������{a:{b:1})����ʱ��Ⱦb����·��Ϊ ��.a.b��
    //@input ���������
    //@conf �ֶε������ã����Բ��裬�����ã�����ԭ�ֶ�����merge
    AForm.prototype.reRender = function(nameOrIndex , jpath , conf , input) {
        var afObj = this;
	};
    //��Ⱦһ������
    //@input ���������
    //@nameOrIndex ���ݵ�key��
    //@jpath ��ǰ���ݵ�·������������{a:{b:1})����ʱ��Ⱦb����·��Ϊ ��.a.b��
    //@hideLabel ����label
    AForm.prototype.renderData = function(input, nameOrIndex, jpath, hideLabel) {
        var afObj = this;
        jpath = jpath || "";

        if (input == null) {
            return "";//����null
        }
        if (input == undefined) {
            input = 'undefined';
        }

        var fieldConfig = this.getConfigByPath(jpath);

        //������Ⱦ�������֮
        if (fieldConfig.noRender) {
            return "";
        }

        //��������Ĭ��ֵ
        fieldConfig.hideCollapser =
                "hideCollapser" in fieldConfig ? fieldConfig.hideCollapser : this.config.hideCollapser;
        fieldConfig.hideColon = "hideColon" in fieldConfig ? fieldConfig.hideColon : this.config.hideColon;
        fieldConfig.hideLabel = "hideLabel" in fieldConfig ? fieldConfig.hideLabel : this.config.hideLabel;
        fieldConfig.showArrayNO = "showArrayNO" in fieldConfig ? fieldConfig.showArrayNO : this.config.showArrayNO;
        fieldConfig.label = fieldConfig.label || this.config.label || nameOrIndex;//û����ȡname or index
        fieldConfig.hideHeader = "hideHeader" in fieldConfig ? fieldConfig.hideHeader : this.config.hideHeader;
        fieldConfig.noCreate = "noCreate" in fieldConfig ? fieldConfig.noCreate : this.config.noCreate;
        fieldConfig.readonly = "readonly" in fieldConfig ? fieldConfig.readonly : this.config.readonly;
        fieldConfig.tipsTpl = "tipsTpl" in fieldConfig ? fieldConfig.tipsTpl : this.config.tipsTpl;
        fieldConfig.validators = fieldConfig.validators || [];
        fieldConfig.attr = fieldConfig.attr || {};//��������
        fieldConfig.ctrlAttr = fieldConfig.ctrlAttr || {};//�����ڿؼ�����
        fieldConfig.cssText = fieldConfig.cssText || "";
        fieldConfig.ctrlAttr["jpath"] = jpath;
        fieldConfig.jpath = jpath;

        fieldConfig.validators = _computeValidator(fieldConfig.validators);
        fieldConfig.valueAdapter = _computeAdapter(fieldConfig.valueAdapter);

        //ֵ��������������name_or_index���ַ�������Ϊ���������ʱ�ſ����䣬���򷵻����鵼������ѭ��
        if (typeof nameOrIndex == "string" && fieldConfig.valueAdapter &&
            typeof fieldConfig.valueAdapter.beforeRender == "function") {
            var tmp = fieldConfig.valueAdapter.beforeRender(input, nameOrIndex);
            //��֧�ֻ������ͣ������ض�����get�������޷���Ч
            input = tmp;
        }
        AForm.renderCount++;
        return sysControl.render(nameOrIndex, input, fieldConfig, AForm.renderCount, afObj, jpath, hideLabel)
    };

    //undefined��nullתΪ���ַ���
    function _s(v) {
        if (v === undefined || v === null) {
            return "";
        }
        return v.toString();
    }

    //����Ĭ������
    function _genDefaultData(fields) {
        if (typeof fields !== "object") {
            return undefined;
        }

        var obj = {};
        for (var p in fields) {
            //����Ƿ������ֶ�
            if (typeof fields[p].fields == "object") {
                if (fields[p].jtype && fields[p].jtype.toLowerCase() == "array") {
                    obj[p] = [_genDefaultData(fields[p].fields)];//����
                } else {
                    obj[p] = _genDefaultData(fields[p].fields);//����
                }
            } else {
                obj[p] = typeof fields[p].defaultValue == "undefined" ? _genBasicDefault(fields[p].jtype) :
                    fields[p].defaultValue;
            }
        }

        var result = {};
        var arr = _sortObject(obj, fields);

        for (var i = 0 , len = arr.length; i < len; i++) {
            result[arr[i]] = obj[arr[i]];
        }
        return result;
    }

    //�Զ���������key��conf������˳��orderԽ��Խ��ǰ
    function _sortObject(obj, fconf) {
        fconf = fconf || {};

        var arr = [];
        var oo = 0;
        for (var k in obj) {
            oo++;
            arr.push(k);

            if (!fconf[k]) {
                fconf[k] = {};
            }

            fconf[k].oOrder = oo;//����ԭ˳�򣬷�ֹ���ȶ�����
        }

        arr.sort(function(x, y) {
            var order1 = fconf[x] && fconf[x].order ? fconf[x].order : 0;
            var order2 = fconf[y] && fconf[y].order ? fconf[y].order : 0;

            if (order2 - order1 > 0) {
                return 1;
            }
            else if (order2 - order1 == 0) {
                return fconf[x].oOrder - fconf[y].oOrder;
            }
            else {
                return -1;
            }
        });

        return arr;
    }

    //������֤��
    function _computeValidator(validators) {
        //ȫ����֤���ӹ�
        if ((typeof validators == "object" && "rule" in validators) || typeof validators == "string") {
            validators = [validators];
        }

        _h.each(validators, function(item, i) {
            if (typeof item == "string") {
                //���ַ�������֤������ע��
                if (AForm.Plugin.validator[item]) {
                    validators[i] = AForm.Plugin.validator[item];
                }
            } else if (typeof item == "object" && typeof item.rule == "string" && item.rule.length > 2) {
                item.rule = new Function("$v", "$ctrl", "return " + item.rule);
            }
        });

        return validators;
    }

    //���������
    function _computeWatch(w) {
        w = w || {};
        return w;
    }

    //����������
    function _computeAdapter(adpt) {
        //ȫ����֤���ӹ�
        if (typeof adpt == "string") {
            adpt = AForm.Plugin.adapter[adpt];
        }

        return adpt;
    }

    //У��������
    function validateInput(af, input, tmpValue, conf, firstInput) {
        //��������֤��ֱ�ӷ���
        if (af.config.noValidate) {
            return true;
        }

        var invalid = false;
        firstInput = firstInput || input;//���ж��ѡ��ʱ��Ϊ��ʱ�۽�����һ��ѡ��
        if (!af.config.noValidate && conf.required && (tmpValue == "")) {
            invalid = true;
            af.emit("empty", [firstInput, conf]);
        }
        //����Ƿ�����
        if (!af.config.noValidate && tmpValue != "" && conf.pattern &&
            !new RegExp("^" + conf.pattern + "$", "i").test(tmpValue)) {
            invalid = true;
            af.emit("invalid", [input, conf, conf.patternErrorMsg || ""]);
        }
        //�������У��
        if (!af.config.noValidate && tmpValue != "" && conf.validators) {
            _h.each(conf.validators, function(item, i) {
                if (typeof item.rule == "function" && item.rule(tmpValue, input) !== true) {
                    if (item.errorMsg !== false) {
                        invalid = true;
                        af.emit("invalid", [input, conf, item.errorMsg]);
                    }
                }
            });
        }

        if (!invalid) {
            af.emit("valid", [input]);
        }
    }

    //�����Զ�������
    function _computeProp(fd, af) {
        if (!fd || typeof fd !== "object") {//��ֹ�ظ�����
            return;
        }
        for (var prop in fd) {

            if (!(prop in AForm.Plugin.prop)) {
                continue;
            }

            fd.ctrlAttr = fd.ctrlAttr || {};
            fd.validators = fd.validators || [];
            fd.attr = fd.attr || {};
            fd.style = fd.style || {};
            fd.ctrlStyle = fd.ctrlStyle || {};

            var propObj = AForm.Plugin.prop[prop];
            propObj.beforeRender && propObj.beforeRender(fd[prop], prop, fd, af);
        }
        //�ݹ�
        if (fd.fields) {
            for (var p in fd.fields) {
                _computeProp(fd.fields[p], af);
            }
        }
    }

    //ִ�к�������
    function _joinFunction(fnArr, caller, arg) {
        var ret = true;
        for (var i = 0; i < fnArr.length; i++) {
            if (arg === undefined) {
                ret = fnArr[i].apply(caller);
            }
            else {
                ret = fnArr[i].apply(caller, arg);
            }
        }
        return ret;
    }

    //����tips
    function _genTips(tipsTpl, fd) {
        var ret = tipsTpl.replace(/\{tips\}/g, _s(fd.tips));
        ret = ret.replace(/\{tipsCssText\}/g, _s(fd.tipsCssText));
        return ret;
    }

    function _genBasicDefault(t) {
        if (!t) {
            return "";
        }
        t = t.toLowerCase();
        switch (t) {
            case "boolean":
                return false;
            default:
                return"";
        }
    }

    //����guid
    function _guid(i, t) {
        return "ctrl_" + _s(t) + "_" + i + "_" + parseInt(Math.random() * 100000);
    }

    function _genPlugin(nameOrIndex, inputData, afObj, type, fd, cssText, tag) {
        var guid = _guid(AForm.renderCount, type);
        controlInstance[guid] = new AForm.Plugin.control[type];

        var thisPlugin = controlInstance[guid];

        //��ʼ������
        thisPlugin.aform = afObj;
        thisPlugin.config = fd;
        thisPlugin.name = nameOrIndex;
        thisPlugin.jpath = fd.jpath;

        var tagName = thisPlugin.tagName || (tag || "span");
        //��ȾǰԤ����
        thisPlugin.beforeRender && thisPlugin.beforeRender(nameOrIndex, inputData, fd);
        var html = "";
        html += ("<" + tagName + " id=\"" + guid + "\" guid=\"" + guid + "\" style=\"" + _s(cssText || fd.ctrlCssText) +
            "\" type=\"" +
            type + "\" class=\"json-field-plugin " + type + " \">");
        //��Ⱦ
        html += (thisPlugin.render(nameOrIndex, inputData, fd, AForm.renderCount, afObj, fd.jpath));
        html += ("</" + tagName + ">");
        //��Ⱦ���
        if (typeof thisPlugin.renderComplete == "function") {
            afObj.one("renderComplete", function() {
                var controlRoot = document.getElementById(guid);
                thisPlugin.rootElement = controlRoot;
                thisPlugin.renderComplete.call(thisPlugin, controlRoot, nameOrIndex, inputData, fd);

                //ע��af-on-{evt}�󶨵��¼�
                var evtBindNodes = controlRoot.querySelectorAll("[af-on-click]");
                _h.each(evtBindNodes, function(ele) {
                    var fn = ele.getAttribute("af-on-click");
                    if (fn in thisPlugin) {
                        _h.addEvent(ele, "click", function(e) {
                            thisPlugin[fn].call(thisPlugin, e || window.event);
                        })
                    }
                })
            })
        }
        return html;
    }

    //�����������ֶεĵ��޸��¼�
    function attachMonitor(container, fn) {
        var hasRootMonitor = container.getAttribute("data-monitor");
        if (!hasRootMonitor) {
            //����radio��checkbox�ĵ���¼�
            _h.addEvent(container, "click", function(e) {
                var target = _h.getTarget(e);
                //�����Ǳ��ֶΣ������
                var jpath = target.getAttribute("jpath");
                if ((target.type !== "radio" && target.type !== "checkbox") || !jpath) {
                    return;//����return false������ie�Ͱ汾�»��ֹ�����Ĭ���¼�
                }

                fn(jpath, target.value, target);
            });
        }

        //����onchange�¼�
        var ie = _h.isIE();
        var ips = [];
        if (ie && ie < 9) {
            ips = _h.getInput(container, false);
        } else {
            //��ͨ��ð�ݰ�ʱ�������ظ���
            if (!hasRootMonitor) {
                ips = [container];
            }
        }

        _h.each(ips, function(ipt) {
            if (ipt.type && !(ipt.getAttribute("jpath"))) {
                return;
            }
            ipt.setAttribute("data-monitor", true);
            _h.addEvent(ipt, "change", function(e) {
                var target = _h.getTarget(e);
                //�����Ǳ��ֶΣ������
                var jpath = target.getAttribute("jpath");
                if (!jpath) {
                    return false;
                }

                fn(jpath, target.value, target);
            });
        });

    }

    //���
    function _debug(msg) {
        if (typeof console == "undefined" || typeof console.log == "undefined") {
            return false;
        }
        else {
            console.log(msg);
        }
    }

    //���˲��Ϸ���bad control char
    function _replaceBadControl(v) {
        v = v.replace(/\\/g, "\\\\");//��б��
        v = v.replace(/"/g, "\\\"");//˫����
        v = v.replace(/\n/g, "\\n");//�س���
        v = v.replace(/\t/g, "\\t");//tab��

        return v;
    }

    //����
    if (typeof module === "object" && module.exports) {
        module.exports = AForm;
    }
    else if (typeof define === "function" && (define.amd || define.fmd)) {
        define("aform", [], function() {
            return AForm;
        });
    }

    if (typeof window !== "undefined") {
        window.AForm = AForm;
    }
})();
