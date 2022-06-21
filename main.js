
function Validator(formSelector, options = {}) {

    const getParent = (element, selector) => {
        while(element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement
            }
            element = element.parentElement 
        }
    }

    var formRules = {}

    /**
     * Quy ước tạo rules
     * 1. Nếu có lỗi return `error message`
     * 2. Nếu không có lỗi return `undefined`
     */
    var validatorRules = {
        required(value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        },
        email(value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Trường này phải là email'
        },
        min(min) {
            return (value) => {
                return value.length >= min ? undefined : `Vui lòng nhập ít nhất ${min} kí tự`;
            }
        },
        max(max) {
            return (value) => {
                return value.length >= max ? undefined : `Vui lòng nhập tối đa ${max} kí tự`;
            }
        }
    }

    // Lấy ra formElement trong DOM theo `formSelector`
    var formElement = document.querySelector(formSelector)

    // Chỉ xử lý khi có element trong DOM
    if (formElement) {
        var inputs = formElement.querySelectorAll('input[name][rules]')

        for (var input of inputs) {
            var rules = input.getAttribute('rules').split('|')

            for (var rule of rules) {

                var ruleInfo
                var isRuleHasValue = rule.includes(':')

                if (isRuleHasValue) {
                    ruleInfo = rule.split(':')
                    rule = ruleInfo[0]
                }

                var ruleFunc = validatorRules[rule]

                if (isRuleHasValue) {
                    ruleFunc = ruleFunc(ruleInfo[1])
                }

                if (Array.isArray(formRules[input.name])) {
                    formRules[input.name].push(ruleFunc)
                } else {
                    formRules[input.name] = [ruleFunc]
                }
            }

            // Lắng nghe sự kiện để validate (blur, change, ...)
            input.onblur = handleValidate
            input.oninput = handleClearError
        }

        // Hàm thực hiện validate
        function handleValidate(e) {
            var rules = formRules[e.target.name]

            for (var rule of rules) {
                errorMessage = rule(e.target.value)
                if (errorMessage) break
            }
            

            // Nếu có lỗi thì hiển thị message lỗi ra UI
            if (errorMessage) {
                var formGroup = getParent(e.target, '.form-group')
                if (formGroup) {
                    formGroup.classList.add('invalid')
                    var formMessage = formGroup.querySelector('.form-message')
                    if (formMessage) {
                        formMessage.innerText = errorMessage
                    }
                }
            }
            return !errorMessage
        }

        // Hàm clear message error
        function handleClearError(e) {
            var formGroup = getParent(e.target, '.form-group')
            if (formGroup.classList.contains('invalid')) {
                formGroup.classList.remove('invalid')
                var formMessage = formGroup.querySelector('.form-message')
                if (formMessage) {
                    formMessage.innerText = ''
                }
            }
        }
    }

    // Xử lý hành vi submit form
    formElement.onsubmit = (e) => {
        e.preventDefault()

        var inputs = formElement.querySelectorAll('input[name][rules]')

        var isValid = true

        for (var input of inputs) {
            if (!handleValidate({ target: input })) {
                isValid = false
            }
        }

        // Khi không có lỗi thì submit form
        if (isValid) {
            if (typeof options.onSubmit === 'function') {
                var enableInputs = formElement.querySelectorAll('[name]:not([disabled])')
                        
                var formValues = Array.from(enableInputs).reduce((values, input) => {
                    switch(input.type) {
                        case 'radio':
                                // Ta sẽ tìm input.name
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                        case 'checkbox':
                            if(!input.matches(':checked'))  {
                                if(!Array.isArray(values[input.name])) {
                                    values[input.name] = '';
                                }
                                return values;
                            }
                            // Nếu nó không phải là Array, thì ta sẽ gán cho nó bằng 1 array trống
                            if(!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            }
                            // Nếu nó là array ta sẽ push value vào
                            values[input.name].push(input.value);
                            break;
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value; //Vế đầu là gán input value cho object value
                    }
                    return values; //Vế 2 là return values
                }, {});

                options.onSubmit(formValues);
            } else {
                formElement.submit()
            }
        }
    }
}


