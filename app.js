document.addEventListener('DOMContentLoaded', () => {
    console.log("Скрипт загружен!");

    // Переключение вкладок
    const tabs = document.querySelectorAll('nav button');
    const sections = document.querySelectorAll('.tab');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(tab.dataset.tab).classList.add('active');

            // Если выбрана вкладка с статистикой, генерируем статистику
            if (tab.dataset.tab === "table-stats") {
                generateStats();  // Генерация статистики
            }
        });
    });

    // Загрузка и отображение CSV
    const fileInput = document.getElementById('file-input');
    const loadButton = document.getElementById('load-file');
    const filePreviewTableBody = document.getElementById('file-preview').querySelector('tbody');
    const editTableBody = document.getElementById('edit-table').querySelector('tbody');

    let studentData = [];

    loadButton.addEventListener('click', () => {
        const file = fileInput.files[0];
        if (!file) {
            alert('Пожалуйста, выберите файл!');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            const rows = parseCSV(content, ';');
            studentData = rows.slice(1); // Пропускаем заголовок
            console.log("Загруженные данные:", studentData);
            displayFilePreview(rows);
            displayEditTable(studentData);
        };
        reader.readAsText(file, 'windows-1251');
    });

    function parseCSV(data, delimiter) {
        const lines = data.split('\n').filter(line => line.trim()); // Разделение на строки
        return lines.map(line => line.split(delimiter).map(cell => cell.trim())); // Разделение строки на ячейки
    }
    function displayFilePreview(rows) {
        filePreviewTableBody.innerHTML = '';
        rows.slice(1).forEach(row => { // Пропускаем заголовок
            const rowElement = document.createElement('tr');
            row.forEach(cell => {
                const cellElement = document.createElement('td');
                cellElement.textContent = cell;
                rowElement.appendChild(cellElement);
            });
            filePreviewTableBody.appendChild(rowElement);
        });
    }

    function displayEditTable(rows) {
        editTableBody.innerHTML = '';
        rows.forEach((row, index) => {
            const rowElement = document.createElement('tr');
            row.forEach((cell, cellIndex) => {
                const cellElement = document.createElement('td');
                cellElement.textContent = cell;
                cellElement.contentEditable = true;
                rowElement.appendChild(cellElement);
            });

            const deleteBtnCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Удалить';
            deleteButton.classList.add('delete-btn');
            deleteButton.onclick = () => deleteStudent(index);
            deleteBtnCell.appendChild(deleteButton);
            rowElement.appendChild(deleteBtnCell);

            editTableBody.appendChild(rowElement);
        });
    }

    function deleteStudent(index) {
        studentData.splice(index, 1);
        displayEditTable(studentData);
    }





    function getRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }

    // Массив для хранения объектов графиков, чтобы их можно было обновить
    let charts = {};

    // Функция для генерации случайных цветов для каждого графика
    function getRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
    }

    // Функция для генерации статистики и графиков по каждому классу и общему графику
    function generateStatistics(studentData) {
        if (studentData.length === 0) return;

        const subjects = ['informatics', 'physics', 'mathematics', 'literature', 'music'];
        const classData = {}; // Храним статистику по каждому классу
        const totalData = { // Для общего графика
            informatics: [0, 0, 0, 0, 0],
            physics: [0, 0, 0, 0, 0],
            mathematics: [0, 0, 0, 0, 0],
            literature: [0, 0, 0, 0, 0],
            music: [0, 0, 0, 0, 0]
        };

        studentData.forEach(student => {
            const studentClass = student[1]; // Предполагаем, что класс находится во 2-м столбце
            if (!classData[studentClass]) {
                classData[studentClass] = {
                    informatics: [],
                    physics: [],
                    mathematics: [],
                    literature: [],
                    music: []
                };
            }

            // Добавляем оценки для каждого предмета в класс
            subjects.forEach((subject, index) => {
                const grade = parseInt(student[index + 2]);
                if (grade >= 1 && grade <= 5) {
                    classData[studentClass][subject].push(grade);
                    totalData[subject][grade - 1]++; // Обновляем общую статистику
                }
            });
        });

        // Генерация графиков для каждого класса
        Object.keys(classData).forEach(className => {
            const classStats = classData[className];

            // Генерация данных для графика
            const data = subjects.map(subject => {
                const gradeCounts = [0, 0, 0, 0, 0]; // количество для оценок 1, 2, 3, 4, 5
                classStats[subject].forEach(grade => {
                    gradeCounts[grade - 1]++;
                });
                return gradeCounts;
            });

            // Если график для этого класса уже существует, просто обновляем его
            if (charts[className]) {
                updateClassChart(className, subjects, data);
            } else {
                // Если график еще не существует, создаем новый
                const container = document.createElement('div');
                container.innerHTML = `
            <h3>График для класса ${className}</h3>
            <canvas id="chart-${className}"></canvas>
        `;
                document.getElementById('graphs-container').appendChild(container);

                // Генерируем новый график и сохраняем его в объекте charts
                charts[className] = generateClassChart(`chart-${className}`, subjects, data, className);
            }
        });

        // Генерация общего графика
        const totalDataArray = subjects.map(subject => totalData[subject]);

        // Если общего графика еще нет, создаем его
        if (!charts['total']) {
            const container = document.createElement('div');
            container.innerHTML = `
        <h3>Общая статистика по всем классам</h3>
        <canvas id="chart-total"></canvas>
    `;
            document.getElementById('graphs-container').appendChild(container);

            // Генерируем новый общий график
            charts['total'] = generateClassChart('chart-total', subjects, totalDataArray, 'total');
        } else {
            // Если график уже есть, обновляем его
            updateClassChart('total', subjects, totalDataArray);
        }
    }

    // Функция для генерации графика для одного класса
    function generateClassChart(id, labels, data, className) {
        const ctx = document.getElementById(id).getContext('2d');
        const colors = [getRandomColor(), getRandomColor(), getRandomColor(), getRandomColor(), getRandomColor()]; // 5 разных цветов для предметов

        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['1', '2', '3', '4', '5'], // Ось X - оценки
                datasets: data.map((gradeCounts, index) => ({
                    label: labels[index],
                    data: gradeCounts,
                    backgroundColor: colors[index],
                    borderColor: colors[index].replace('0.6', '1'), // Граница будет темнее
                    borderWidth: 1
                }))
            },
            options: {
                scales: {
                    x: { // Ось X - оценки
                        title: {
                            display: true,
                            text: 'Оценка'
                        }
                    },
                    y: { // Ось Y - количество учеников
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Количество учеников'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function (tooltipItem) {
                                return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
                            }
                        }
                    }
                },
                title: {
                    display: true,
                    text: className === 'total' ? 'Общие оценки по всем классам' : `Оценки по предметам для класса ${className}`
                }
            }
        });
    }

    // Функция для обновления статистики при изменении таблицы
    function updateGraphsFromTable() {
        // Получаем данные из таблицы
        const studentData = [];
        const rows = document.querySelectorAll('table tr'); // Предполагаем, что данные находятся в таблице

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 1) { // Пропускаем заголовки
                const student = [];
                student.push(cells[0].innerText); // Имя студента
                student.push(cells[1].innerText); // Класс
                for (let i = 2; i < cells.length; i++) {
                    student.push(parseInt(cells[i].innerText)); // Оценки
                }
                studentData.push(student);
            }
        });

        // Обновляем графики на основе новых данных
        generateStatistics(studentData);
    }

    // Функция для обновления уже существующего графика
    function updateClassChart(className, labels, data) {
        const chart = charts[className];

        // Обновляем данные для каждого графика
        chart.data.datasets = data.map((gradeCounts, index) => ({
            label: labels[index],
            data: gradeCounts,
            backgroundColor: chart.data.datasets[index].backgroundColor, // Сохраняем цвет
            borderColor: chart.data.datasets[index].borderColor,
            borderWidth: 1
        }));

        // Обновляем сам график
        chart.update();
    }

    // Добавляем обработчик событий для всех ячеек таблицы
    document.querySelectorAll('table td').forEach(cell => {
        cell.addEventListener('input', updateGraphsFromTable);
    });

    // Функция для вычисления медианы
    function calculateMedian(arr) {
        const sorted = arr.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    // Генерация статистики по всем ученикам
    function generateStats() {
        // Проверяем, есть ли загруженные данные
        if (studentData.length === 0) {
            alert("Нет данных для генерации статистики.");
            return;
        }

        console.log("Генерация статистики для", studentData.length, "учеников.");

        const subjects = ['Информатика', 'Физика', 'Математика', 'Литература', 'Музыка'];
        const classData = {};

        // Сгруппируем студентов по классам
        studentData.forEach(student => {
            const className = student[1]; // Класс — это второй элемент (индекс 1)

            if (!classData[className]) {
                classData[className] = [];
            }
            classData[className].push(student);
        });

        console.log("Сгруппированные данные по классам:", classData);

        // Генерация статистики для каждого класса
        generateClassStats(classData);

        // Генерация общей статистики для всех учеников
        generateOverallStats(studentData);

        // Генерация графиков для оценки
        generateStatistics(studentData);
    }

    function generateClassStats(classData) {
        const subjects = ['Информатика', 'Физика', 'Математика', 'Литература', 'Музыка'];
        const classStatsDiv = document.getElementById('class-stats');
        classStatsDiv.innerHTML = '';  // Очищаем предыдущую статистику

        // Перебираем классы
        Object.entries(classData).forEach(([className, students]) => {
            subjects.forEach((subject, index) => {
                // Для каждого предмета собираем оценки
                const subjectGrades = students.map(student => parseInt(student[index + 2])); // Оценки начинаются с индекса 2

                // Расчет средней оценки
                const avgGrade = (subjectGrades.reduce((sum, grade) => sum + grade, 0) / subjectGrades.length).toFixed(2);

                // Расчет медианы
                const medianGrade = calculateMedian(subjectGrades);

                // Подсчет оценок по категориям
                const gradeCounts = [1, 2, 3, 4, 5].map(grade => subjectGrades.filter(g => g === grade).length);
                const gradePercents = gradeCounts.map(count => ((count / subjectGrades.length) * 100).toFixed(2));

                // Создание таблицы для каждого предмета
                const table = document.createElement('table');
                table.classList.add('stats-table');
                table.innerHTML = `
    <caption>${className} - ${subject}</caption>
    <thead>
        <tr>
            <th>Средняя оценка</th>
            <th>Медиана</th>
            <th>5</th>
            <th>4</th>
            <th>3</th>
            <th>2</th>
            <th>1</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>${avgGrade}</td>
            <td>${medianGrade}</td>
            <td>${gradeCounts[4]} (${gradePercents[4]}%)</td>
            <td>${gradeCounts[3]} (${gradePercents[3]}%)</td>
            <td>${gradeCounts[2]} (${gradePercents[2]}%)</td>
            <td>${gradeCounts[1]} (${gradePercents[1]}%)</td>
            <td>${gradeCounts[0]} (${gradePercents[0]}%)</td>
        </tr>
    </tbody>
`;

                classStatsDiv.appendChild(table);
            });
        });
    }

    function generateOverallStats(studentData) {
        const subjects = ['Информатика', 'Физика', 'Математика', 'Литература', 'Музыка'];
        const overallStatsDiv = document.getElementById('all-students-stats'); // Изменено на правильный элемент
        overallStatsDiv.innerHTML = ''; // Очищаем старую статистику

        // Сбор оценок по всем предметам
        const allGrades = [0, 0, 0, 0, 0]; // Для каждой оценки (1, 2, 3, 4, 5)
        const totalGradesCount = studentData.length * subjects.length; // Общее количество оценок

        studentData.forEach(student => {
            subjects.forEach((subject, index) => {
                const grade = parseInt(student[index + 2]); // Оценки начинаются с индекса 2
                if (grade >= 1 && grade <= 5) {
                    allGrades[grade - 1]++;
                }
            });
        });

        // Генерация таблицы с общей статистикой
        const table = document.createElement('table');
        table.classList.add('stats-table');
        table.innerHTML = `
        <caption>Общая статистика по всем ученикам</caption>
        <thead>
            <tr>
                <th>Оценка</th>
                <th>Количество</th>
                <th>%</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>5</td>
                <td>${allGrades[4]}</td>
                <td>${((allGrades[4] / totalGradesCount) * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <td>4</td>
                <td>${allGrades[3]}</td>
                <td>${((allGrades[3] / totalGradesCount) * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <td>3</td>
                <td>${allGrades[2]}</td>
                <td>${((allGrades[2] / totalGradesCount) * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <td>2</td>
                <td>${allGrades[1]}</td>
                <td>${((allGrades[1] / totalGradesCount) * 100).toFixed(2)}%</td>
            </tr>
            <tr>
                <td>1</td>
                <td>${allGrades[0]}</td>
                <td>${((allGrades[0] / totalGradesCount) * 100).toFixed(2)}%</td>
            </tr>
        </tbody>
    `;
        overallStatsDiv.appendChild(table);
    }

    // Загрузка файла и обработка данных
    document.getElementById('load-file').addEventListener('click', function () {
        const fileInput = document.getElementById('file-input');
        const file = fileInput.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const csvData = event.target.result;
                const studentData = parseCSV(csvData); // Парсим данные
                generateOverallStats(studentData); // Генерация таблицы статистики
                generateGraphStats(studentData); // Генерация графиков
            };
            reader.readAsText(file);
        }
    });


    // Функция для обновления статистики в таблице
    function updateTableStats() {
        if (studentData.length === 0) return;

        let tableHTML = '';
        studentData.forEach(student => {
            tableHTML += `
            <tr>
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${student.informatics}</td>
                <td>${student.physics}</td>
                <td>${student.mathematics}</td>
                <td>${student.literature}</td>
                <td>${student.music}</td>
            </tr>
        `;
        });
        document.getElementById('all-students-stats').innerHTML = tableHTML;
    }

    // Добавление нового ученика
    const addStudentForm = document.getElementById('add-student-form');
    addStudentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newStudent = [
            document.getElementById('student-name').value,
            document.getElementById('student-class').value,
            document.getElementById('informatics').value,
            document.getElementById('physics').value,
            document.getElementById('mathematics').value,
            document.getElementById('literature').value,
            document.getElementById('music').value
        ];

        studentData.push(newStudent);
        displayEditTable(studentData); // Обновление таблицы
        addStudentForm.reset(); // Очистка формы
    });
});

