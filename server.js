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
	var formData = { name: 'aisultan.kassenov', pass: 'Minilogo6651' };
	var options = {
		url: loginUrl,
		method: 'POST',
		form: {
			name: 'aisultan.kassenov',
			pass: 'Minilogo6651',
			form_id: 'user_login',
			op: 'Log in'
		}
	};
	var text = [];

	request(options, function(error, response, body) {
		var cookie = response.headers['set-cookie'];

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
					// console.log(typeof (str));
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
					text[i] = str.replace(new RegExp('    <-span>', 'g'), '');
					str = text[i];
					text[i] = str.split('                            ');
					text[i] = text[i].filter(string => string !== '');
					text[i] = text[i].filter(
						string =>
							string !==
							'  <-table>                    <-div>                <-div>                <-div>                "'
					);
					// for (let j = 0; j < text[i].length; j++) {
					//     var string = text[i][j];
					//     text[i][j] = string.split('\\r\\n          ');
					// }
				}
				res.json(text);
			}
		);
	});

	console.log(text);
});

app.listen(app.get('port'), function() {
	console.log('Magic is happening on port: ', app.get('port'));
});

exports = module.exports = app;
