package main

import (
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"net/http"
	"os"
)

func authMiddleware(c *gin.Context) {
	var secretString = os.Getenv("JWT_SECRET")
	var jwtSecret = []byte(secretString)

	if secretString == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		c.Abort()
		return
	}

	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		c.Abort()
		return
	}

	token, err := jwt.Parse(authHeader, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}

		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		c.Abort()
		return
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		email, emailOk := claims["email"].(string)
		role, roleOk := claims["role"].(string)
		username, usernameOk := claims["username"].(string)

		if emailOk && roleOk && usernameOk {
			c.Set("email", email)
			c.Set("role", role)
			c.Set("username", username)
		}
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		c.Abort()
		return
	}

	c.Next()
}

func main() {
	router := gin.Default()
	router.POST("/upload", authMiddleware, uploadImage)
	var err = router.Run(":8080")

	if err != nil {
		return
	}
}
