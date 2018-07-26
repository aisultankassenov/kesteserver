var express = require('express');
var app = express();
var request = require('request');
request = request.defaults({ jar: true });
var cheerio = require('cheerio');

app.set('port', process.env.PORT || 5000);

app.use(express.static(__dirname + '/public'));

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

	request(options, function(error, response, body) {
		var cookie = response.headers['set-cookie'];
		var text = [];

		request.get(
			{
				url:
					'https://registrar.nu.edu.kz/my-registrar/personal-schedule/json?_dc=1532493031960&method=drawStudentSchedule',
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
					console.log(str);
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
							str = str.replace(new RegExp(' AM', 'g'), '');
							var time =
								parseInt(str[0] + str[1]) + 12 + str[2] + str[3] + str[4];
							text[i][j] = time;
						}
					}
				}
				// console.log(text);
				res.json(text);
			}
		);
	});
});
app.get('/schedule2', function(req, res) {
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
		var cookie = response.headers['set-cookie'];
		var text = [];

		request.get(
			{
				url:
					'https://registrar.nu.edu.kz/my-registrar/personal-schedule/json?_dc=1532521851073&method=drawStudentSchedule&type=reg',
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
					console.log(str);
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
							str = str.replace(new RegExp(' AM', 'g'), '');
							var time =
								parseInt(str[0] + str[1]) + 12 + str[2] + str[3] + str[4];
							text[i][j] = time;
						}
					}
				}
				// console.log(text);
				res.json(text);
			}
		);
	});
});

app.get('/logout', function(req, res) {
	request.get(
		{
			url: 'https://registrar.nu.edu.kz/user/logout'
		},
		function(req, res) {
			console.log(res.headers);
		}
	);
});

app.listen(app.get('port'), function() {
	console.log('Magic is happening on port: ', app.get('port'));
});

exports = module.exports = app;
