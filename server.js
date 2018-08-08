var express = require('express');
var app = express();
var request = require('request');
request = request.defaults({ jar: true });
var cheerio = require('cheerio');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

app.get('/info', function(req, res) {
	var urlWithLoginForm = 'https://registrar.nu.edu.kz/';
	var loginUrl = urlWithLoginForm + '/index.php?q=user/login';
	var options = {
		url: loginUrl,
		method: 'POST',
		form: {
			name: req.query.name,
			pass: req.query.pass,
			form_id: 'user_login',
			op: 'Log in'
		}
	};

	request(options, function(error, response, body) {
		if (!response) {
			res.sendStatus(500);
			return;
		}
		var cookie = response.headers['set-cookie'];
		var text = [];

		// console.log(cookie);
		if (!cookie) {
			res.sendStatus(403);
			return;
		}

		request.get(
			{
				url:
					'https://registrar.nu.edu.kz/my-registrar/personal-schedule/json?_dc=1533010471054&method=getStudentInfo',
				Cookie: cookie
			},
			function(err, resp, body) {
				var str = body;
				str = str.replace(new RegExp('"', 'g'), '');
				str = str.replace(new RegExp('{', 'g'), '');
				str = str.replace(new RegExp('}', 'g'), '');
				str = str.replace(/\[+(.*?)\]+/g, '$1');
				str = str.split(',');
				text = str;
				for (let i = 0; i < str.length; i++) {
					text[i] = text[i].split(':');
					if (
						text[i][0] === 'FIRSTNAME' ||
						text[i][0] === 'STUDENTID' ||
						text[i][0] === 'LASTNAME' ||
						text[i][0] === 'NUEMAIL' ||
						text[i][0] === 'YOS' ||
						text[i][0] === 'MAJORNAME'
					) {
						text[i].push('');
					}
				}
				text = text.filter(array => array.length === 3);
				text = text.map(array => array.splice(1, 1));
				request.get({
					url: 'https://registrar.nu.edu.kz/user/logout'
				});
				res.json(text);
			}
		);
	});
});

app.get('/schedule', function(req, res) {
	var urlWithLoginForm = 'https://registrar.nu.edu.kz/';
	var loginUrl = urlWithLoginForm + '/index.php?q=user/login';
	var options = {
		url: loginUrl,
		method: 'POST',
		form: {
			name: req.query.name,
			pass: req.query.pass,
			form_id: 'user_login',
			op: 'Log in'
		}
	};

	// console.log(options);

	request(options, function(error, response, body) {
		// console.log(error);
		// console.log(response.headers);

		if (!response) {
			res.sendStatus(500);
			return;
		}

		var cookie = response.headers['set-cookie'];

		// console.log(cookie);
		if (!cookie) {
			res.sendStatus(403);
			return;
		}
		var text = [];

		request.get(
			{
				url:
					'https://registrar.nu.edu.kz/my-registrar/personal-schedule/json?method=drawStudentSchedule&type=reg',
				Cookie: cookie
			},
			function(err, response, body) {
				var k = 0;
				var $ = cheerio.load(body);
				$('tbody')
					.children()
					.each(function(i, elem) {
						text[k++] = $(this).text();
					});
				for (let i = 0; i < k; i++) {
					var str = text[i];
					text[i] = str.replace(new RegExp('<\\\\/td>', 'g'), '');
					str = text[i];
					text[i] = str.replace(new RegExp('\\\\r\\\\n', 'g'), '');
					str = text[i];
					text[i] = str.replace(new RegExp('<\\\\/i>', 'g'), '');
					str = text[i];
					text[i] = str.replace(new RegExp('\\\\/', 'g'), '-');
					str = text[i];
					text[i] = str.replace(new RegExp('<-tr>', 'g'), '');
					str = text[i];
					text[i] = str.replace(new RegExp('<-span>', 'g'), '');
					str = text[i];
					// console.log(str);
					text[i] = str.split('                            ');
					text[i] = text[i].filter(string => string !== '');
					text[i] = text[i].filter(string => string !== '    ');
					text[i] = text[i].filter(string => string !== '   ');
					text[i] = text[i].filter(string => string !== ' ');
					text[i] = text[i].filter(string => string !== '  ');
					text[i] = text[i].filter(
						string =>
							string !==
							'  <-table>                    <-div>                <-div>                <-div>                "'
					);
					for (let j = 0; j < text[i].length; j++) {
						str = text[i][j];
						if (
							str.charAt(str.length - 2) === 'A' &&
							str.charAt(str.length - 1) === 'M'
						) {
							text[i][j] = str.replace(new RegExp(' AM', 'g'), '');
						}
						if (
							str.charAt(str.length - 2) === 'P' &&
							str.charAt(str.length - 1) === 'M'
						) {
							text[i][j] = str.replace(new RegExp(' PM', 'g'), '');
							if (
								str.charAt(str.length - 2) !== 1 &&
								str.charAt(str.length - 1) !== 2
							) {
								if (str.charAt(0) + str.charAt(1) !== '12') {
									var time =
										parseInt(str[0] + str[1]) + 12 + str[2] + str[3] + str[4];
									text[i][j] = time;
								}
							}
						}
					}
				}
				let obj = {};

				for (let index = 0; index < text.length; index++) {
					const element = text[index];
					if (element.length === 1) {
						index++;
						let array = [];
						while (true) {
							array.push(text[index]);
							index++;
							if (index === text.length || text[index].length === 1) {
								index--;
								break;
							}
						}
						obj = { ...obj, [element]: array };
					}
				}
				request.get({
					url: 'https://registrar.nu.edu.kz/user/logout'
				});
				res.json(scheduleToItems(obj));
			}
		);
	});
});

const scheduleToItems = schedules => {
	const parse = name => {
		return schedules[name].map(schedule => {
			const item = {
				time: {
					from: schedule[0],
					to: schedule[1]
				},
				date: {
					from: schedule[7],
					to: schedule[8]
				},
				room: schedule[2],
				title: schedule[3],
				type: schedule[5],
				profName: schedule[6]
			};

			return item;
		});
	};

	const data = Object.keys(schedules).reduce((acc, item) => {
		acc[item] = parse(item);
		return acc;
	}, {});

	return data;
};

app.get('/image', function(req, res) {
	var options = {
		url:
			'http://my.nu.edu.kz/wps/portal/student/!ut/p/b1/04_Sj9CPykssy0xPLMnMz0vM0Q_0yU9PT03xLy0BSUWZxRv5B7o6Ohk6Grj7GJoZOHp7BZq6mVsaGYQYAhVEAhUY4ACOBoT0h-tH4VXiYwZVgMcKP4R7CzJyLD11HRUBTJ2PsA!!/dl4/d5/L2dBISEvZ0FBIS9nQSEh/pw/Z7_2OQEAB1A0GUP70Q8T8QUCT00G5/act/id=0/393877287541/-/?login=' +
			req.query.name +
			'&password=' +
			req.query.pass +
			'&loginSubmit=Login'
	};

	request.get(options, function(error, response, body) {
		var $$ = cheerio.load(body);
		var source = $$('.linkLogout').attr('href');
		console.log(source);
		request.get(
			'http://my.nu.edu.kz/wps/myportal/student/home/my_account/!ut/p/b1/04_SjzQ0NjcxNDYyNbDUj9CPykssy0xPLMnMz0vMAfGjzOKN_ANdHZ0MHQ3cfQzNDBy9vQJN3cwtjZx9TYEKIoEKDHAARwNC-sP1o_ApMXAxgSrAY4WfR35uqn5uVI6lp66jIgBkvDO-/dl4/d5/L2dQX19fX0EhL29Ed3dBQUFRaENFSVFoQ0VJUWhDRUlRaENFSVFoQUEhLzRKa0dZaG1ZWmhHWlJtTVpuR1lKbVNaaW1acG1HWmxtWTVtZVpnV1pGbUpabVdZVm1WWmpXWjFtRFprMll0bWJaaDAhL1o2XzJPUUVBQjFBMEdMMTYwQUtKUTVGNzkyQ001L1o2XzJPUUVBQjFBMEdMMTYwQUtKUTVGNzkyQ0UxL1o2XzJPUUVBQjFBMDAzTDMwQUNOVkJWNUkyMEcxL1o2XzJPUUVBQjFBME81TkEwQTczRVQ2MzUxME81L1o2XzJPUUVBQjFBMEc1VkYwQVM1MUlJTEkzMDQ0L1o2XzJPUUVBQjFBMDAxMkUwQUtWMzhERU8xMFUyL1o2XzJPUUVBQjFBME9OQUQwQUNTVTBDMFExMEQ2L1o2XzJPUUVBQjFBMDgxTzcwQVNERUdLOTcyMEcxL1o2XzJPUUVBQjFBMEcwN0IwQTVQQjFPSDQwMEcxL1o2XzJPUUVBQjFBMEc1UDYwQUY4QTFLTkQyMEc1L1o2XzJPUUVBQjFBME9OQUQwQUNTVTBDMFExMDUzL1o2XzJPUUVBQjFBMDhNRTgwQVNKRzVDTkIwMDgwL1o2XzJPUUVBQjFBMDhWRzgwUU8wVExPMEQyMEcxL1o2XzJPUUVBQjFBMDBDRzcwQVVLUzNGU0cyMDQwL1o2XzJPUUVBQjFBMEdWTzcwUU8wVEgwSUYxMEcxL1o2XzJPUUVBQjFBMDBDRzcwQVVLUzNGU0cyME82L1o2XzJPUUVBQjFBMDBDRzcwQVVLUzNGU0cyMDQ1L1o2XzJPUUVBQjFBMDAwSDgwQVJFUUJPSFMxMDg3L1o2XzJPUUVBQjFBMEdCSTUwQUlDVFNMU1UxMEcxL1o2XzJPUUVBQjFBMDhUVjAwQVNQRkdMQ0owMEs1L1o2XzJPUUVBQjFBMDhDSTcwQUkyMDFNTTQwME8zL1o2XzJPUUVBQjFBMEc0OTUwQTFTUUhMNEkxMEcxL1o2XzJPUUVBQjFBMEc1UDYwQUY4QTFLTkQyMEc3L1o2XzJPUUVBQjFBMDhNRTgwQVNKRzVDTkIwMDg1L1o2XzJPUUVBQjFBME8wUDcwQTdRM0czUzIxMDQ1L1o2XzJPUUVBQjFBMEdHSTUwQUw3NlVJRTcxMEcxL1o2XzJPUUVBQjFBMDBCRkIwQVRNS1AwNEIyMEcxL1o2XzJPUUVBQjFBMEdTMzQwQTUxUFBSVjEyMEs0/',
			function(err, response, body) {
				// console.log(body);
				var $ = cheerio.load(body);
				var src = $('.my_profile')
					.children('.profile_photo')
					.children()
					.attr('src');
				request.get({
					url: 'http://my.nu.edu.kz/' + source
				});
				res.json(src);
			}
		);
	});
});

app.listen(app.get('port'), function() {
	console.log('Magic is happening on port: ', app.get('port'));
});

exports = module.exports = app;
