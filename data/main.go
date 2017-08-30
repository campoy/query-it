package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"strconv"

	"golang.org/x/oauth2/google"

	"google.golang.org/api/bigquery/v2"
)

type data struct {
	Questions []question `json:"questions,omitempty"`
	Total     int        `json:"total,omitempty"`
}

type answer struct {
	Label  string  `json:"label,omitempty"`
	Number float64 `json:"number,omitempty"`
}

type question struct {
	Top10                []answer               `json:"top10,omitempty"`
	Answer               string                 `json:"answer,omitempty"`
	AnswerValue          float64                `json:"answerValue,omitempty"`
	Question             string                 `json:"question,omitempty"`
	RowIndex             int                    `json:"rowIndex,omitempty"`
	Approved             bool                   `json:"approved,omitempty"`
	Params               map[string]interface{} `json:"params,omitempty"`
	SQL                  string                 `json:"sql,omitempty"`
	InputSQL             string                 `json:"inputSQL,omitempty"`
	Databases            string                 `json:"databases,omitempty"`
	Units                string                 `json:"units,omitempty"`
	HasPassingInputQuery bool                   `json:"hasPassingInputQuery"`
	RowsSearched         uint64                 `json:"rowsSearched,omitempty"`
}

func main() {
	b, err := ioutil.ReadFile("data.json")
	if err != nil {
		log.Fatal(err)
	}
	var input data
	if err := json.Unmarshal(b, &input); err != nil {
		log.Fatal(err)
	}

	b, err = ioutil.ReadFile("cert.json")
	if err != nil {
		log.Fatal(err)
	}
	client, err := google.DefaultClient(context.Background(), bigquery.BigqueryScope)
	if err != nil {
		log.Fatal(err)
	}
	bq, err := bigquery.New(client)
	if err != nil {
		log.Fatal(err)
	}

	var result data

	const projectID = "sodium-primer-120219"

loop:
	for i, question := range input.Questions {
		log.Println(i)

		res, err := bq.Jobs.Query(projectID, &bigquery.QueryRequest{Query: question.SQL}).Do()
		if err != nil {
			log.Println(err)
			continue
		}

		if len(res.Rows) < 10 {
			log.Printf("got %d results for question %d, skipping", len(res.Rows), i)
			log.Printf("query: %s", question.SQL)
			continue
		}
		question.Top10 = nil
		for _, row := range res.Rows[:10] {
			label := row.F[0].V.(string)
			v, err := strconv.ParseFloat(row.F[1].V.(string), 64)
			if err != nil {
				log.Printf("could not parse float64: %+v", row.F[0].V)
				continue loop
			}
			question.Top10 = append(question.Top10, answer{label, v})
		}

		question.Answer = question.Top10[0].Label
		question.AnswerValue = question.Top10[0].Number
		result.Questions = append(result.Questions, question)
	}

	result.Total = len(result.Questions)

	b, _ = json.MarshalIndent(result, "", "    ")
	fmt.Printf("%s", b)
}
