export default function calculateDownloadScore(dailyDownloads) {

     let weeklyDownloads = [];
     let count = 0;
     let tempWeekSum = 0;
     let totalSum = 0;
     for (let dayDownloads of dailyDownloads) {
          count++;
          tempWeekSum = tempWeekSum + dayDownloads.downloads;
          totalSum = totalSum + dayDownloads.downloads;
          if (count === 7) {
               weeklyDownloads.push(tempWeekSum);
               count = 0;
               tempWeekSum = 0;
          }
     }
     let weeklyAvgDownloads = totalSum / 52;
     let downloadScore = 0;
     console.log(weeklyAvgDownloads);

     if (weeklyAvgDownloads > 100000) downloadScore = 5;
     else if (weeklyAvgDownloads > 10000) downloadScore = 4;
     else if (weeklyAvgDownloads > 1000) downloadScore = 3;
     else downloadScore = 1;

     let totalWeeks = weeklyDownloads.length;
     let ups = 0;
     let downs = 0;
     for (let i = 1; i < totalWeeks; i++) {
          if (weeklyDownloads[i] >= weeklyDownloads[i - 1]) ups++;
          else downs++;
     }

     downloadScore += ((ups) / (ups + downs)) * 5; // scale of 10

     return downloadScore;
}