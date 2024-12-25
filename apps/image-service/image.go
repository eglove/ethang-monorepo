package main

import (
	"bytes"
	"context"
	"fmt"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
	"github.com/oklog/ulid"
	"image"
	"image/png"
	"log"
	"math/rand"
	"mime/multipart"
	"net/http"
	"time"
)

var bucketName = "ethang-images"
var accountId = "a8f0595f3ed6a751169523771aa503cd"
var apiToken = "mpxw222VFTcZCJhhtZXZSdtRro93Nd8tVwlncOD0"
var accessKeyId = "7b5646b6e76c91da16a7e363d06af1ad"
var secretAccessKey = "81d1eea8ff8bb97c90c906c027753dd49e34a1ba9dfe86070f8be04b1320a761"
var bucketEndpint = "https://a8f0595f3ed6a751169523771aa503cd.r2.cloudflarestorage.com"

var sizes = []struct{ width, height int }{
	{1, 1},
	{128, 128},
	{512, 512},
	{1024, 1024},
}

func uploadImage(c *gin.Context) {
	file, _, err := c.Request.FormFile("image")

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Failed to get file from request": err.Error()})
		return
	}
	defer func(file multipart.File) {
		err := file.Close()
		if err != nil {
			fmt.Println("Failed to close file")
		}
	}(file)

	img, _, err := image.Decode(file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Failed to decode image": err.Error()})
		return
	}

	cfg, err := config.LoadDefaultConfig(
		context.TODO(),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyId, secretAccessKey, "")),
		config.WithRegion("auto"),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountId))
	})

	randomSource := rand.New(rand.NewSource(time.Now().UnixNano()))
	uniqueKey := ulid.MustNew(ulid.Timestamp(time.Now()), randomSource).String()

	urls := map[string]string{}

	for _, size := range sizes {
		resizedImage := imaging.Resize(img, size.width, 0, imaging.Lanczos)
		var buf bytes.Buffer
		err := png.Encode(&buf, resizedImage)
		if err != nil {
			log.Printf("Failed to encode image: %v", err)
			continue
		}
		key := fmt.Sprintf("%s-%d-%d", uniqueKey, size.width, size.height)

		_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
			Bucket:      &bucketName,
			Key:         aws.String(key),
			Body:        bytes.NewReader(buf.Bytes()),
			ContentType: aws.String("image/png"),
		})

		if err != nil {
			log.Printf("Failed to upload image %s: %v", key, err)
			continue
		}

		urls[fmt.Sprintf("%dx%d", size.width, size.height)] = fmt.Sprintf("%s/%s", "images.ethang.dev", key)
	}

	c.JSON(http.StatusOK, gin.H{"urls": urls})
	return
}
